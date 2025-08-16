module.exports = {
    meta: {
        type: 'layout',
        docs: {
            description: 'Enforce specific API comment layout',
            category: 'Stylistic Issues',
            recommended: false
        },
        fixable: 'whitespace',
        schema: []
    },
    create(context) {
        return {
            Program(node) {
                const sourceCode = context.getSourceCode();
                const comments = sourceCode.getAllComments();

                comments.forEach(comment => {
                    if (comment.type === 'Block' && comment.value.trim().startsWith('PUT - ')) {
                        const commentLines = comment.value.split('\n');
                        const baseIndentation = commentLines[0].match(/^\s*/)[0];

                        // Check if the comment follows our expected format
                        const expectedFormat = [
                            /PUT - [A-Za-z\s]+/,
                            /\s*\/api\/[A-Za-z\/]+/,
                            /\s+\/:[\w]+ - .+/,
                            /\s+\/ +- .+/
                        ];

                        const actualLines = commentLines.map(line => line.trim());
                        const hasCorrectFormat = expectedFormat.every((pattern, index) => {
                            return actualLines[index] && pattern.test(actualLines[index]);
                        });

                        if (!hasCorrectFormat) {
                            context.report({
                                node,
                                loc: comment.loc,
                                message: 'API comment layout should follow the standard format',
                                fix(fixer) {
                                    const originalText = sourceCode.getText(comment);
                                    const lines = originalText.split('\n');
                                    
                                    // Preserve the first line as is
                                    const firstLine = lines[0];
                                    const endpoint = lines[1]?.trim();
                                    const params = lines.slice(2).map(line => line.trim());
                                    
                                    const newText = [
                                        firstLine,
                                        `    ${endpoint}`,
                                        ...params.map(param => `                        ${param}`)
                                    ].join('\n');
                                    
                                    return fixer.replaceText(comment, newText);
                                }
                            });
                        }
                    }
                });
            }
        };
    }
}; 