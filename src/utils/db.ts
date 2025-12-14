import { Application, Resume, ItemType, PrepQuestion } from '../components/types';
import { encryptData, decryptData } from './cryptoUtils';

const DB_NAME = 'JobAppManagerDB';
const DB_VERSION = 3; // Increment version for prepQuestions store

export class DB {
    private db: IDBDatabase | null = null;
    private key: CryptoKey | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event);
                reject('Error opening database');
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains('applications')) {
                    db.createObjectStore('applications', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('resumes')) {
                    db.createObjectStore('resumes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('items')) {
                    db.createObjectStore('items', { keyPath: 'type' });
                }
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('prepQuestions')) {
                    db.createObjectStore('prepQuestions', { keyPath: 'id' });
                }
            };
        });
    }

    setKey(key: CryptoKey) {
        this.key = key;
    }

    async getSalt(): Promise<Uint8Array | null> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('DB not initialized');
            const tx = this.db.transaction('metadata', 'readonly');
            const store = tx.objectStore('metadata');
            const req = store.get('salt');
            req.onsuccess = () => resolve(req.result ? new Uint8Array(req.result.value) : null);
            req.onerror = () => reject(req.error);
        });
    }

    async setSalt(salt: Uint8Array): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('DB not initialized');
            const tx = this.db.transaction('metadata', 'readwrite');
            const store = tx.objectStore('metadata');
            const req = store.put({ id: 'salt', value: Array.from(salt) });
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    async clearDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('DB not initialized');
            const tx = this.db.transaction(['applications', 'resumes', 'items', 'metadata', 'prepQuestions'], 'readwrite');

            tx.objectStore('applications').clear();
            tx.objectStore('resumes').clear();
            tx.objectStore('items').clear();
            tx.objectStore('metadata').clear();
            tx.objectStore('prepQuestions').clear();

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
        if (!this.db) throw new Error('Database not initialized');
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    // Generic Encrypted Helpers
    private async saveEncrypted(storeName: string, item: any): Promise<void> {
        if (!this.key) throw new Error('Encryption key not set');
        // Encrypt everything except ID? Or just wrap it.
        // We need ID for keyPath.
        const id = item.id || item.type; // resumes/apps have id, items have type
        if (!id) throw new Error('Item missing ID');

        const encrypted = await encryptData(item, this.key);

        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName, 'readwrite').put({
                id: id,
                // store original key if different from id (like type for items)
                type: item.type,
                encrypted: encrypted
            });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    private async getDecrypted<T>(storeName: string): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const request = this.getStore(storeName).getAll();
            request.onsuccess = async () => {
                try {
                    const results = request.result;
                    if (!results.length) return resolve([]);

                    // Check if encrypted
                    if (results[0].encrypted && this.key) {
                        const decrypted = await Promise.all(results.map(r => decryptData(r.encrypted, this.key!)));
                        resolve(decrypted);
                    } else if (results[0].encrypted && !this.key) {
                        reject('Data is encrypted but no key provided');
                    } else {
                        // Plain text (migration needs to happen if key is set?)
                        resolve(results as T[]);
                    }
                } catch (e) {
                    reject(e);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Applications
    async getApplications(): Promise<Application[]> {
        return this.getDecrypted<Application>('applications');
    }

    async saveApplication(application: Application): Promise<void> {
        return this.saveEncrypted('applications', application);
    }

    async deleteApplication(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = this.getStore('applications', 'readwrite').delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Resumes
    async getResumes(): Promise<Resume[]> {
        return this.getDecrypted<Resume>('resumes');
    }

    async saveResume(resume: Resume): Promise<void> {
        return this.saveEncrypted('resumes', resume);
    }

    async deleteResume(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = this.getStore('resumes', 'readwrite').delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Items
    async getItems(): Promise<Record<ItemType, any[]>> {
        const rawItems = await this.getDecrypted<{ type: ItemType; items: any[] }>('items');

        const itemsRecord: Record<ItemType, any[]> = {
            projects: [],
            skills: [],
            education: [],
            'certificates & awards': [],
            bootcamps: [],
            volunteering: [],
            'experience': [],
            coursework: [],
        };

        rawItems.forEach(row => {
            if (itemsRecord[row.type] !== undefined) {
                itemsRecord[row.type] = row.items;
            }
        });
        return itemsRecord;
    }

    async saveItems(type: ItemType, items: any[]): Promise<void> {
        if (!this.key) throw new Error('Encryption key not set');
        // Structure for Items store needs to match what we expect
        const itemObj = { id: type, type, items };
        return this.saveEncrypted('items', itemObj);
    }

    // Prep Questions
    async getPrepQuestions(): Promise<PrepQuestion[]> {
        return this.getDecrypted<PrepQuestion>('prepQuestions');
    }

    async savePrepQuestion(question: PrepQuestion): Promise<void> {
        return this.saveEncrypted('prepQuestions', question);
    }

    async deletePrepQuestion(id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = this.getStore('prepQuestions', 'readwrite').delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const db = new DB();
