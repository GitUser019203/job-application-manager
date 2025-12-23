export const parseResumeContent = (content: string): Record<string, string> => {
    const sections: Record<string, string> = {};
    const lines = content.split('\n');
    let currentSection = 'Header';
    let currentContent: string[] = [];

    // Regex for Section Headers: **UPPERCASE** or ## Title
    const sectionHeaderRegex = /^(\*\*[A-Z\s&]+\*\*|##\s+.+)$/;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (sectionHeaderRegex.test(trimmed)) {
            // Save previous section
            if (currentContent.length > 0 || sections[currentSection]) {
                const existing = sections[currentSection] ? sections[currentSection] + '\n\n' : '';
                sections[currentSection] = existing + currentContent.join('\n').trim();
            }

            // Start new section
            // Strip ** or ## from the line to get the clean section title
            currentSection = trimmed.replace(/\*\*/g, '').replace(/^##\s+/, '').trim();
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

    // Process Header to structured JSON format
    const rawHeader = sections['Header'] || '';
    if (rawHeader) {
        let name = 'Your Name';
        let phone = 'Phone';
        let email = 'Email';
        let linkedin = 'LinkedIn';

        // Check if it's already our new JSON format
        if (rawHeader.startsWith('RESUME_HEADER_JSON:')) {
            // Already normalized
        } else if (rawHeader && rawHeader.includes('<div')) {
            // Legacy HTML parsing
            const nameMatch = rawHeader.match(/<h1>(.*?)<\/h1>/);
            if (nameMatch) name = nameMatch[1] || name;
            const spans = rawHeader.match(/<span>(.*?)<\/span>/g) || [];
            if (spans[0]) phone = spans[0].replace(/<\/?span>/g, '');
            if (spans[1]) email = spans[1].replace(/<\/?span>/g, '');
            if (spans[2]) linkedin = spans[2].replace(/<\/?span>/g, '');

            sections['Header'] = `RESUME_HEADER_JSON:${JSON.stringify({ name, phone, email, linkedin })}`;
        } else {
            // Standard Markdown parsing (existing logic)
            const nameMatch = rawHeader.match(/^\*\*(.+?)\*\*/m);
            if (nameMatch) name = nameMatch[1] || name;

            const tableLineRegex = /\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/;
            const headerLines = rawHeader.split('\n');
            for (const line of headerLines) {
                if (line.trim().match(/^\|[\s-]+\|/)) continue;
                const match = line.match(tableLineRegex);
                if (match) {
                    const c1 = match[1] || '';
                    const c2 = match[2] || '';
                    const c3 = match[3] || '';
                    const vals = [c1.trim(), c2.trim(), c3.trim()];
                    email = vals.find(v => v.includes('@')) || email;
                    linkedin = vals.find(v => v.toLowerCase().includes('linkedin')) || linkedin;
                    phone = vals.find(v => /[0-9]{3}/.test(v) && !v.includes('@') && !v.includes('linkedin')) || phone;
                    break;
                }
            }
            sections['Header'] = `RESUME_HEADER_JSON:${JSON.stringify({ name, phone, email, linkedin })}`;
        }
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
            content += `## ${title}\n\n${text}\n\n`;
        }
    });

    return content.trim();
};
