export const parseResumeContent = (content: string): Record<string, string> => {
    const sections: Record<string, string> = {};
    const lines = content.split('\n');
    let currentSection = 'Header';
    let currentContent: string[] = [];

    // Regex for Section Headers: **UPPERCASE**
    const sectionHeaderRegex = /^\*\*[A-Z\s&]+\*\*$/;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (sectionHeaderRegex.test(trimmed)) {
            // Save previous section
            if (currentContent.length > 0 || sections[currentSection]) {
                const existing = sections[currentSection] ? sections[currentSection] + '\n\n' : '';
                sections[currentSection] = existing + currentContent.join('\n').trim();
            }

            // Start new section
            currentSection = trimmed.replace(/\*\*/g, '').trim();
            currentContent = [];
        } else {
            currentContent.push(line);
        }
    });

    // Save last section
    if (currentContent.length > 0) {
        const existing = sections[currentSection] ? sections[currentSection] + '\n\n' : '';
        sections[currentSection] = existing + currentContent.join('\n').trim();
    }

    // Process Header to HTML format
    if (sections['Header']) {
        const rawHeader = sections['Header'];
        // Extract Name (First bold line)
        const nameMatch = rawHeader.match(/^\*\*(.+?)\*\*/m);
        const name = nameMatch ? nameMatch[1] : 'Your Name';

        // Extract Table info
        const tableLineRegex = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/;
        const headerLines = rawHeader.split('\n');
        let phone = '';
        let linkedin = '';
        let email = '';

        for (const line of headerLines) {
            if (line.trim().match(/^\|[\s-]+\|/)) continue; // Skip separator line |---|---|
            const match = line.match(tableLineRegex);
            if (match) {
                const c1 = match[1].trim();
                const c2 = match[2].trim();
                const c3 = match[3].trim();
                // Ignore empty cells if possible, but structure suggests 3 cols
                if (c1 || c2 || c3) {
                    const vals = [c1, c2, c3];
                    // Heuristics
                    email = vals.find(v => v.includes('@')) || '';
                    linkedin = vals.find(v => v.toLowerCase().includes('linkedin')) || '';
                    phone = vals.find(v => /[0-9]{3}/.test(v) && !v.includes('@') && !v.includes('linkedin')) || '';

                    if (!phone && !linkedin && !email) {
                        // Fallback order from example
                        phone = c1;
                        linkedin = c2;
                        email = c3;
                    }
                    break;
                }
            }
        }

        const htmlHeader = `<div class="text-center"><h1>${name}</h1></div>\n\n----------\n\n<div class="flex justify-between w-full">\n  <span>${phone || 'Phone'}</span>\n  <span>${email || 'Email'}</span>\n  <span>${linkedin || 'LinkedIn'}</span>\n</div>`;
        sections['Header'] = htmlHeader;
    }

    // Normalize Keys to match Editor expectation (Title Case)
    // Map UPPERCASE keys to Title Case keys
    const normalizedSections: Record<string, string> = {};
    Object.entries(sections).forEach(([key, val]) => {
        let newKey = key;
        const upperKey = key.toUpperCase();

        if (key === 'Header') newKey = 'Header';
        else if (upperKey === 'SKILLS') newKey = 'Skills';
        else if (upperKey === 'EDUCATION') newKey = 'Education';
        else if (upperKey === 'WORK EXPERIENCE' || upperKey === 'EXPERIENCE') newKey = 'Experience';
        else if (upperKey === 'PROJECTS' || upperKey === 'PROJECT') newKey = 'Projects';
        else if (upperKey === 'VOLUNTEERING') newKey = 'Volunteering';
        else if (upperKey === 'COURSEWORK') newKey = 'Coursework';
        else if (upperKey.includes('CERTIFICATES')) newKey = 'Certificates & Awards';
        else {
            // Title Case
            newKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        }

        normalizedSections[newKey] = val;
    });

    return normalizedSections;
};

export const compileResumeContent = (sections: Record<string, string>): string => {
    let content = '';

    // Ensure Header comes first if it exists
    if (sections['Header']) {
        content += sections['Header'] + '\n\n';
    }

    Object.entries(sections).forEach(([title, text]) => {
        if (title !== 'Header') {
            if (text.startsWith('---')) {
                content += `## ${title}\n\n${text}\n\n`;
            } else {
                content += `## ${title}\n\n***\n\n${text}\n\n`;
            }
        }
    });

    return content.trim();
};
