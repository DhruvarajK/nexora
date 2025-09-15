/**
 * Suggests a chat title based on the first message. It uses a chain of
 * analyzers to handle various types of input, from greetings to code.
 *
 * @param {string} message The user's first message.
 * @returns {string} A suggested chat title.
 */
function suggestChatName(message) {
    // 1. Initial Validation
    if (!message || typeof message !== 'string' || !message.trim()) {
        return 'Untitled Chat';
    }
    const cleanMessage = message.trim();

    // 2. Analyzer Chain (in order of priority)
    const analyzers = [
        analyzeGreeting,
        analyzeGibberish,
        analyzeCode,
        analyzeQuestion,
        analyzeCommand,
        extractKeywordSummary // General purpose fallback
    ];

    for (const analyzer of analyzers) {
        const title = analyzer(cleanMessage);
        if (title) {
            return title;
        }
    }

    // 3. Ultimate Fallback
    return 'New Chat';
}

// --- Analyzers & Helpers ---

/**
 * Checks for common greetings.
 */
function analyzeGreeting(text) {
    const GREETINGS = new Set([
        'hi', 'hello', 'hey', 'yo', 'sup', 'heya',
        'good morning', 'good afternoon', 'good evening'
    ]);
    if (GREETINGS.has(text.toLowerCase())) {
        return 'Greeting';
    }
    return null;
}

/**
 * Catches very short, repetitive, or nonsensical messages.
 */
function analyzeGibberish(text) {
    // Too short to be meaningful (and not a greeting)
    if (text.length < 4) {
        return 'Quick Note';
    }
    // Repetitive characters (e.g., "aaaaaaa", "lolololol")
    if (/(.)\1{4,}/.test(text)) {
        return 'Random Input';
    }
    // Mostly non-alphanumeric characters
    const alphaNumericRatio = (text.match(/[a-zA-Z0-9]/g) || []).length / text.length;
    if (alphaNumericRatio < 0.3) {
        return 'Symbols & Punctuation';
    }
    return null;
}

/**
 * Detects if the text is likely code and extracts a summary.
 */
function analyzeCode(text) {
    const CODE_SIGNALS = [
        // General
        '=>', ';', '{', '}', '#', '//', '/*', '`',
        // JS/TS
        'function ', 'console.', 'var ', 'let ', 'const ', 'import ', 'export ', 'async ', 'await ',
        // Python
        'def ', 'class ', 'import ', 'print(',
        // Java/C#/C++
        'public ', 'private ', 'static ', 'void ', 'main(', 'std::', 'System.out',
        // HTML/XML
        '<div>', '<p>', '/>',
        // SQL
        'SELECT ', 'FROM ', 'WHERE ', 'INSERT ',
    ];
    const assignmentCount = (text.match(/\w+\s*=\s*[^=]/g) || []).length;
    const newlineCount = (text.match(/\n/g) || []).length;

    const isCode = CODE_SIGNALS.some(sig => text.includes(sig)) ||
                   assignmentCount >= 2 ||
                   (newlineCount >= 1 && text.length > 40);

    if (!isCode) {
        return null;
    }

    // Attempt to extract a specific title from the code
    const funcMatch = text.match(/(?:function|def)\s+([a-zA-Z_]\w*)/);
    if (funcMatch) return `Function: ${capitalize(funcMatch[1])}`;

    const classMatch = text.match(/class\s+([a-zA-Z_]\w*)/);
    if (classMatch) return `Class: ${capitalize(classMatch[1])}`;

    return 'Code Snippet'; // A reasonable default for detected code
}


/**
 * Detects if the message is a question.
 */
function analyzeQuestion(text) {
    const QUESTION_STARTERS = ['what', 'who', 'when', 'where', 'why', 'how', 'which', 'is', 'are', 'do', 'does', 'can', 'could', 'would', 'will'];
    const lowerCaseText = text.toLowerCase();
    const startsWithQuestionWord = QUESTION_STARTERS.some(word => lowerCaseText.startsWith(word + ' '));

    if (startsWithQuestionWord || text.endsWith('?')) {
        const summary = extractKeywordSummary(text, 4); // Get a slightly longer summary for questions
        return summary ? `Question: ${summary}` : 'General Question';
    }
    return null;
}

/**
 * Detects if the message is a command or request.
 */
function analyzeCommand(text) {
    const COMMAND_STARTERS = ['write', 'create', 'explain', 'translate', 'summarize', 'give me', 'list', 'generate', 'act as', 'tell me about'];
    const lowerCaseText = text.toLowerCase();
    const startsWithCommand = COMMAND_STARTERS.some(word => lowerCaseText.startsWith(word + ' '));

    if (startsWithCommand) {
        const summary = extractKeywordSummary(text, 4);
        return summary ? `Task: ${summary}` : 'User Request';
    }
    return null;
}


/**
 * Extracts key words from text, avoiding common "stop words".
 * This is the general-purpose title generator.
 */
function extractKeywordSummary(text, wordCount = 3) {
    const STOP_WORDS = new Set([
        // Expanded Stop Word List
        'a', 'about', 'all', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'but', 'by',
        'can', 'could', 'did', 'do', 'does', 'for', 'from', 'get', 'got', 'had',
        'has', 'have', 'he', 'her', 'hers', 'him', 'his', 'how', 'i', 'if', 'in',
        'into', 'is', 'it', 'its', 'just', 'like', 'make', 'many', 'me', 'more',
        'most', 'my', 'no', 'not', 'now', 'of', 'on', 'or', 'our', 'out', 'she',
        'should', 'so', 'some', 'that', 'the', 'their', 'them', 'then', 'there',
        'these', 'they', 'this', 'those', 'to', 'too', 'use', 'was', 'we', 'were',
        'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would',
        'you', 'your', 'help', 'want', 'fix', 'issue', 'code', 'snippet', 'question'
    ]);

    // Match words that are 3+ letters long
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g);
    if (!words) return null;

    const filtered = [];
    for (const word of words) {
        if (!STOP_WORDS.has(word) && !filtered.includes(word)) {
            filtered.push(word);
            if (filtered.length === wordCount) break;
        }
    }

    if (!filtered.length) return null;

    return filtered.map(capitalize).join(' ');
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}