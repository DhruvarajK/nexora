import re

# Language-specific patterns for detection
LANGUAGE_PATTERNS = [
    ("Python", [re.compile(r'\bdef\b'), re.compile(r'\bclass\b'), re.compile(r'\bimport\b'), re.compile(r'\bfrom\b')]),
    ("JavaScript", [re.compile(r'\bfunction\b'), re.compile(r'\bvar\b'), re.compile(r'\blet\b'), re.compile(r'\bconst\b'), re.compile(r'\basync\b'), re.compile(r'console\.')]),
    ("Java", [re.compile(r'\bpublic\b'), re.compile(r'\bclass\b'), re.compile(r'\bstatic\b'), re.compile(r'\bvoid\b'), re.compile(r'System\.out')]),
    ("C++", [re.compile(r'#include'), re.compile(r'\busing namespace\b'), re.compile(r'\bint main\(\)'), re.compile(r'cout <<')]),
    ("SQL", [re.compile(r'\bSELECT\b'), re.compile(r'\bFROM\b'), re.compile(r'\bWHERE\b'), re.compile(r'\bINSERT INTO\b')]),
    ("HTML", [re.compile(r'<\w+>'), re.compile(r'</\w+>'), re.compile(r'<!DOCTYPE')]),
    ("CSS", [re.compile(r'\.\w+'), re.compile(r'#\w+'), re.compile(r'\w+\s*:\s*\w+;')]),
    ("Ruby", [re.compile(r'\bdef\b'), re.compile(r'\bclass\b'), re.compile(r'\brequire\b'), re.compile(r'\bend\b')]),
    ("PHP", [re.compile(r'<\?php'), re.compile(r'\becho\b'), re.compile(r'\$'), re.compile(r'->')]),
    ("Go", [re.compile(r'\bpackage\b'), re.compile(r'\bfunc\b'), re.compile(r'\bimport\b'), re.compile(r'fmt\.')]),
    ("Swift", [re.compile(r'\bfunc\b'), re.compile(r'\blet\b'), re.compile(r'\bvar\b'), re.compile(r'\bclass\b')]),
    ("Bash", [re.compile(r'#!/bin/bash'), re.compile(r'\becho\b'), re.compile(r'\bif\s*\['), re.compile(r'\$')]),
    # Add more languages as needed
]

# Patterns for extracting specific titles
EXTRACTION_PATTERNS = [
    (re.compile(r'(?:function|def|func|fn)\s+([a-zA-Z_]\w*)'), 'Function: {}'),
    (re.compile(r'(?:public\s+)?class\s+([a-zA-Z_]\w*)'), 'Class: {}'),
    (re.compile(r'(?:public\s+)?struct\s+([a-zA-Z_]\w*)'), 'Struct: {}'),
    # Add more patterns for other constructs if needed
]

def suggest_chat_name(message: str) -> str:
    """
    Suggests a chat title based on the first message. It uses a chain of
    analyzers to handle various types of input, from greetings to code.

    Args:
        message: The user's first message.

    Returns:
        A suggested chat title.
    """
    if not message or not isinstance(message, str) or not message.strip():
        return 'Untitled Chat'
    
    clean_message = message.strip()

    analyzers = [
        analyze_greeting,
        analyze_code,
        analyze_gibberish,
        analyze_question,
        analyze_command,
        extract_keyword_summary,
    ]

    for analyzer in analyzers:
        title = analyzer(clean_message)
        if title:
            return title

    return 'New Chat'

def analyze_greeting(text: str) -> str | None:
    """Checks for common greetings."""
    GREETINGS = {
        'hi', 'hello', 'hey', 'yo', 'sup', 'heya',
        'good morning', 'good afternoon', 'good evening'
    }
    if text.lower() in GREETINGS:
        return 'Greeting'
    return None

def analyze_code(text: str) -> str | None:
    """
    Detects if the text is likely code and identifies the programming language.
    """
    CODE_SIGNALS = [
        '//', '/*', '*/', '=>', '->', '::', ';', '{', '}', '#include',
        'def ', 'class ', 'import ', 'print(', 'require ', ' end',
        'function ', 'const ', 'let ', 'var ', 'async ', 'await ', 'console.', '`',
        '<div>', '<script>', '</', '/>', '`',
        'public ', 'private ', 'static ', 'void ', 'System.out', 'string[', 'fun ',
        'func ', 'package ', 'fn ', 'let mut',
        '<?php', '$', 'echo ',
        'SELECT ', 'FROM ', 'WHERE ', 'INSERT INTO', 'CREATE TABLE',
    ]

    has_signal = any(sig in text for sig in CODE_SIGNALS)
    assignment_count = len(re.findall(r'\w+\s*=\s*[^=]', text))
    newline_count = text.count('\n')
    bracket_count = text.count('(') + text.count(')')
    is_indented_line = text.startswith((' ', '\t')) and newline_count == 0

    is_code = (
        has_signal or
        assignment_count >= 2 or
        (bracket_count > 2 and len(text) < 100) or
        (newline_count >= 1 and len(text) > 30) or
        is_indented_line
    )

    if not is_code:
        return None

    # Identify the programming language
    identified_language = None
    for lang, patterns in LANGUAGE_PATTERNS:
        for pattern in patterns:
            if pattern.search(text):
                identified_language = lang
                break
        if identified_language:
            break

    # Extract specific title
    for pattern, title_format in EXTRACTION_PATTERNS:
        if match := pattern.search(text):
            name = match.group(1).capitalize()
            return title_format.format(name)

    # Use language-specific or generic title
    if identified_language:
        return f"{identified_language} Code" if identified_language != "SQL" else "SQL Query"
    return 'Code Snippet'

def analyze_gibberish(text: str) -> str | None:
    """Catches very short, repetitive, or nonsensical messages."""
    if len(text) < 4:
        return 'Quick Note'
    
    if re.search(r'(\S)\1{5,}', text):
        return 'Random Input'
    
    if len(text) > 10:
        alpha_chars = sum(1 for char in text if char.isalpha())
        if (alpha_chars / len(text)) < 0.2:
            return 'Symbols & Punctuation'
    
    return None

def analyze_question(text: str) -> str | None:
    """Detects if the message is a question."""
    QUESTION_STARTERS = ('what', 'who', 'when', 'where', 'why', 'how', 'which', 
                         'is', 'are', 'do', 'does', 'can', 'could', 'would', 'will')
    lower_text = text.lower()
    
    if lower_text.startswith(QUESTION_STARTERS) or lower_text.endswith('?'):
        summary = extract_keyword_summary(text, word_count=4)
        return f"{summary}" if summary else 'General Question'
    
    return None

def analyze_command(text: str) -> str | None:
    """Detects if the message is a command or request."""
    COMMAND_STARTERS = ('write', 'create', 'explain', 'translate', 'summarize', 
                        'give me', 'list', 'generate', 'act as', 'tell me about')
    
    if text.lower().startswith(COMMAND_STARTERS):
        summary = extract_keyword_summary(text, word_count=4)
        return f"Task: {summary}" if summary else 'User Request'
        
    return None

def extract_keyword_summary(text: str, word_count: int = 3) -> str | None:
    """Extracts key words from text, avoiding common 'stop words'."""
    STOP_WORDS = {
        'a', 'about', 'all', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'but', 'by',
        'can', 'could', 'did', 'do', 'does', 'for', 'from', 'get', 'got', 'had',
        'has', 'have', 'he', 'her', 'hers', 'him', 'his', 'how', 'i', 'if', 'in',
        'into', 'is', 'it', 'its', 'just', 'like', 'make', 'many', 'me', 'more',
        'most', 'my', 'no', 'not', 'now', 'of', 'on', 'or', 'our', 'out', 'she',
        'should', 'so', 'some', 'that', 'the', 'their', 'them', 'then', 'there',
        'these', 'they', 'this', 'those', 'to', 'too', 'use', 'was', 'we', 'were',
        'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would',
        'you', 'your', 'help', 'want', 'fix', 'issue', 'code', 'snippet', 'question'
    }
    
    words = re.findall(r'\b[a-z]{3,}\b', text.lower())
    if not words:
        return None

    filtered = []
    for word in words:
        if word not in STOP_WORDS and word not in filtered:
            filtered.append(word)
            if len(filtered) == word_count:
                break
    
    if not filtered:
        return None

    return ' '.join(word.capitalize() for word in filtered)

if __name__ == '__main__':
    messages = [
        "def my_function(): pass",           # Function: My_function
        "class MyClass:",                    # Class: Myclass
        "public class HelloWorld { }",       # Class: Helloworld
        "function myFunc() { }",             # Function: Myfunc
        "SELECT * FROM users;",              # SQL Query
        "<div>Hello</div>",                  # HTML Code
        ".my-class { color: red; }",         # CSS Code
        "int x = 5;",                        # Code Snippet
        "console.log('Hello');",             # JavaScript Code
        "System.out.println('Hello');",      # Java Code
        "def self.my_method",                # Ruby Code
        "<?php echo 'Hello';",               # PHP Code
        "package main; func main() { }",     # Go Code
        "func myFunc() -> Int { }",          # Swift Code
        "#!/bin/bash\necho Hello",           # Bash Script
        "zzzzzzzzzzzzzzzzzz",                # Random Input
        "what is the capital of Kerala?",    # Question: Capital Kerala
        "hi there",                          # Greeting
        None                                 # Untitled Chat
    ]
