export const parseResumeContent = (content: string): Record<string, string> => {
    const sections: Record<string, string> = {};
    const lines = content.split('\n');
    let currentSection = 'Header';
    let currentContent: string[] = [];

    lines.forEach(line => {
        const match = line.match(/^##\s+(.+)$/);
        if (match) {
            if (currentContent.length > 0) {
                sections[currentSection] = currentContent.join('\n').trim();
            }
            currentSection = match[1].trim();
            currentContent = [];
        } else {
            currentContent.push(line);
        }
    });

    if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
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
