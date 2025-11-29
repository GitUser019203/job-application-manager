import { Application, Resume, ItemType } from '../components/types';

const DB_NAME = 'JobAppManagerDB';
const DB_VERSION = 1;

export class DB {
    private db: IDBDatabase | null = null;

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
            };
        });
    }

    private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
        if (!this.db) throw new Error('Database not initialized');
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }

    // Applications
    async getApplications(): Promise<Application[]> {
        return new Promise((resolve, reject) => {
            const request = this.getStore('applications').getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveApplication(application: Application): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = this.getStore('applications', 'readwrite').put(application);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
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
        return new Promise((resolve, reject) => {
            const request = this.getStore('resumes').getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveResume(resume: Resume): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = this.getStore('resumes', 'readwrite').put(resume);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
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
        return new Promise((resolve, reject) => {
            const request = this.getStore('items').getAll();
            request.onsuccess = () => {
                const results = request.result as { type: ItemType; items: any[] }[];
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

                results.forEach(row => {
                    if (itemsRecord[row.type] !== undefined) {
                        itemsRecord[row.type] = row.items;
                    }
                });
                resolve(itemsRecord);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveItems(type: ItemType, items: any[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = this.getStore('items', 'readwrite').put({ type, items });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const db = new DB();
