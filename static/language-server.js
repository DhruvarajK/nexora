function setupLanguageProviders(language) {
    switch (language) {
        case 'python':
            setupPythonProvider();
            break;
        case 'java':
            setupJavaProvider();
            break;
        case 'cpp':
        case 'c':
            setupCppProvider();
            break;
        case 'csharp':
            setupCSharpProvider();
            break;
        case 'go':
            setupGoProvider();
            break;
        case 'rust':
            setupRustProvider();
            break;
        case 'sql':
            setupSqlProvider();
            break;
        case 'html':
            setupHtmlProvider();
            break;
        case 'css':
            setupCssProvider();
            break;
    }
}

// Python autocompletion provider
function setupPythonProvider() {
    monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: function(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const suggestions = [
                // Built-in functions
                { label: 'abs', kind: monaco.languages.CompletionItemKind.Function, insertText: 'abs(${1:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'aiter', kind: monaco.languages.CompletionItemKind.Function, insertText: 'aiter(${1:async_iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'all', kind: monaco.languages.CompletionItemKind.Function, insertText: 'all(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'anext', kind: monaco.languages.CompletionItemKind.Function, insertText: 'anext(${1:async_iterator})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'any', kind: monaco.languages.CompletionItemKind.Function, insertText: 'any(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'ascii', kind: monaco.languages.CompletionItemKind.Function, insertText: 'ascii(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'bin', kind: monaco.languages.CompletionItemKind.Function, insertText: 'bin(${1:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'bool', kind: monaco.languages.CompletionItemKind.Function, insertText: 'bool(${1:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'breakpoint', kind: monaco.languages.CompletionItemKind.Function, insertText: 'breakpoint()', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'bytearray', kind: monaco.languages.CompletionItemKind.Function, insertText: 'bytearray(${1:source})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'bytes', kind: monaco.languages.CompletionItemKind.Function, insertText: 'bytes(${1:source})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'callable', kind: monaco.languages.CompletionItemKind.Function, insertText: 'callable(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'chr', kind: monaco.languages.CompletionItemKind.Function, insertText: 'chr(${1:i})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'classmethod', kind: monaco.languages.CompletionItemKind.Function, insertText: 'classmethod(${1:function})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'compile', kind: monaco.languages.CompletionItemKind.Function, insertText: 'compile(${1:source}, ${2:filename}, ${3:mode})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'complex', kind: monaco.languages.CompletionItemKind.Function, insertText: 'complex(${1:real})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'delattr', kind: monaco.languages.CompletionItemKind.Function, insertText: 'delattr(${1:object}, ${2:name})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'dict', kind: monaco.languages.CompletionItemKind.Function, insertText: 'dict(${1:})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'dir', kind: monaco.languages.CompletionItemKind.Function, insertText: 'dir(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'divmod', kind: monaco.languages.CompletionItemKind.Function, insertText: 'divmod(${1:a}, ${2:b})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'enumerate', kind: monaco.languages.CompletionItemKind.Function, insertText: 'enumerate(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'eval', kind: monaco.languages.CompletionItemKind.Function, insertText: 'eval(${1:expression})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'exec', kind: monaco.languages.CompletionItemKind.Function, insertText: 'exec(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'filter', kind: monaco.languages.CompletionItemKind.Function, insertText: 'filter(${1:function}, ${2:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'float', kind: monaco.languages.CompletionItemKind.Function, insertText: 'float(${1:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'format', kind: monaco.languages.CompletionItemKind.Function, insertText: 'format(${1:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'frozenset', kind: monaco.languages.CompletionItemKind.Function, insertText: 'frozenset(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'getattr', kind: monaco.languages.CompletionItemKind.Function, insertText: 'getattr(${1:object}, ${2:name})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'globals', kind: monaco.languages.CompletionItemKind.Function, insertText: 'globals()', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'hasattr', kind: monaco.languages.CompletionItemKind.Function, insertText: 'hasattr(${1:object}, ${2:name})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'hash', kind: monaco.languages.CompletionItemKind.Function, insertText: 'hash(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'help', kind: monaco.languages.CompletionItemKind.Function, insertText: 'help(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'hex', kind: monaco.languages.CompletionItemKind.Function, insertText: 'hex(${1:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'id', kind: monaco.languages.CompletionItemKind.Function, insertText: 'id(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'input', kind: monaco.languages.CompletionItemKind.Function, insertText: 'input(${1:prompt})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'int', kind: monaco.languages.CompletionItemKind.Function, insertText: 'int(${1:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'isinstance', kind: monaco.languages.CompletionItemKind.Function, insertText: 'isinstance(${1:object}, ${2:classinfo})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'issubclass', kind: monaco.languages.CompletionItemKind.Function, insertText: 'issubclass(${1:class}, ${2:classinfo})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'iter', kind: monaco.languages.CompletionItemKind.Function, insertText: 'iter(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'len', kind: monaco.languages.CompletionItemKind.Function, insertText: 'len(${1:})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'list', kind: monaco.languages.CompletionItemKind.Function, insertText: 'list(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'locals', kind: monaco.languages.CompletionItemKind.Function, insertText: 'locals()', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'map', kind: monaco.languages.CompletionItemKind.Function, insertText: 'map(${1:function}, ${2:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'max', kind: monaco.languages.CompletionItemKind.Function, insertText: 'max(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'memoryview', kind: monaco.languages.CompletionItemKind.Function, insertText: 'memoryview(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'min', kind: monaco.languages.CompletionItemKind.Function, insertText: 'min(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'next', kind: monaco.languages.CompletionItemKind.Function, insertText: 'next(${1:iterator})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'object', kind: monaco.languages.CompletionItemKind.Function, insertText: 'object()', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'oct', kind: monaco.languages.CompletionItemKind.Function, insertText: 'oct(${1:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'open', kind: monaco.languages.CompletionItemKind.Function, insertText: 'open(${1:file}, ${2:mode})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'ord', kind: monaco.languages.CompletionItemKind.Function, insertText: 'ord(${1:c})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'pow', kind: monaco.languages.CompletionItemKind.Function, insertText: 'pow(${1:base}, ${2:exp})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print(${1:})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'property', kind: monaco.languages.CompletionItemKind.Function, insertText: 'property(${1:fget})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'range', kind: monaco.languages.CompletionItemKind.Function, insertText: 'range(${1:start}, ${2:stop})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'repr', kind: monaco.languages.CompletionItemKind.Function, insertText: 'repr(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'reversed', kind: monaco.languages.CompletionItemKind.Function, insertText: 'reversed(${1:seq})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'round', kind: monaco.languages.CompletionItemKind.Function, insertText: 'round(${1:number})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'set', kind: monaco.languages.CompletionItemKind.Function, insertText: 'set(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'setattr', kind: monaco.languages.CompletionItemKind.Function, insertText: 'setattr(${1:object}, ${2:name}, ${3:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'slice', kind: monaco.languages.CompletionItemKind.Function, insertText: 'slice(${1:start}, ${2:stop})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'sorted', kind: monaco.languages.CompletionItemKind.Function, insertText: 'sorted(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'staticmethod', kind: monaco.languages.CompletionItemKind.Function, insertText: 'staticmethod(${1:function})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'str', kind: monaco.languages.CompletionItemKind.Function, insertText: 'str(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'sum', kind: monaco.languages.CompletionItemKind.Function, insertText: 'sum(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'super', kind: monaco.languages.CompletionItemKind.Function, insertText: 'super()', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'tuple', kind: monaco.languages.CompletionItemKind.Function, insertText: 'tuple(${1:iterable})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'type', kind: monaco.languages.CompletionItemKind.Function, insertText: 'type(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'vars', kind: monaco.languages.CompletionItemKind.Function, insertText: 'vars(${1:object})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'zip', kind: monaco.languages.CompletionItemKind.Function, insertText: 'zip(${1:iterable1}, ${2:iterable2})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Keywords and statements
                { label: 'and', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'and', range },
                { label: 'as', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'as', range },
                { label: 'assert', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'assert ${1:condition}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'async', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'async ', range },
                { label: 'await', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'await ${1:expression}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'break', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'break', range },
                { label: 'class', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'class ${1:ClassName}:\n\t${2:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'continue', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'continue', range },
                { label: 'def', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'def ${1:function_name}(${2:parameters}):\n\t${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'del', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'del ${1:variable}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'elif', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'elif ${1:condition}:\n\t${2:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'else', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'else:\n\t${1:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'except', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'except ${1:Exception} as ${2:e}:\n\t${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'False', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'False', range },
                { label: 'finally', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'finally:\n\t${1:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'from', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'from ${1:module} import ${2:function}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'global', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'global ${1:variable}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if ${1:condition}:\n\t${2:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'import', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'import ${1:module}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'in', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'in', range },
                { label: 'is', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'is', range },
                { label: 'lambda', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'lambda ${1:args}: ${2:expression}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'None', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'None', range },
                { label: 'nonlocal', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'nonlocal ${1:variable}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'not', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'not', range },
                { label: 'or', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'or', range },
                { label: 'pass', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'pass', range },
                { label: 'raise', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'raise ${1:Exception}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ${1:value}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'True', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'True', range },
                { label: 'try', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while ${1:condition}:\n\t${2:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'with', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'with ${1:expression} as ${2:target}:\n\t${3:pass}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'yield', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'yield ${1:value}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },

                // Common exceptions (as classes)
                { label: 'Exception', kind: monaco.languages.CompletionItemKind.Class, insertText: 'Exception', range },
                { label: 'BaseException', kind: monaco.languages.CompletionItemKind.Class, insertText: 'BaseException', range },
                { label: 'ArithmeticError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'ArithmeticError', range },
                { label: 'AssertionError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'AssertionError', range },
                { label: 'AttributeError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'AttributeError', range },
                { label: 'EOFError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'EOFError', range },
                { label: 'FloatingPointError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'FloatingPointError', range },
                { label: 'GeneratorExit', kind: monaco.languages.CompletionItemKind.Class, insertText: 'GeneratorExit', range },
                { label: 'ImportError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'ImportError', range },
                { label: 'IndexError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'IndexError', range },
                { label: 'KeyError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'KeyError', range },
                { label: 'KeyboardInterrupt', kind: monaco.languages.CompletionItemKind.Class, insertText: 'KeyboardInterrupt', range },
                { label: 'LookupError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'LookupError', range },
                { label: 'MemoryError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'MemoryError', range },
                { label: 'NameError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'NameError', range },
                { label: 'NotImplementedError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'NotImplementedError', range },
                { label: 'OSError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'OSError', range },
                { label: 'OverflowError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'OverflowError', range },
                { label: 'ReferenceError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'ReferenceError', range },
                { label: 'RuntimeError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'RuntimeError', range },
                { label: 'StopIteration', kind: monaco.languages.CompletionItemKind.Class, insertText: 'StopIteration', range },
                { label: 'SyntaxError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'SyntaxError', range },
                { label: 'IndentationError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'IndentationError', range },
                { label: 'TabError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'TabError', range },
                { label: 'SystemError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'SystemError', range },
                { label: 'SystemExit', kind: monaco.languages.CompletionItemKind.Class, insertText: 'SystemExit', range },
                { label: 'TypeError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'TypeError', range },
                { label: 'UnboundLocalError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'UnboundLocalError', range },
                { label: 'UnicodeError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'UnicodeError', range },
                { label: 'UnicodeEncodeError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'UnicodeEncodeError', range },
                { label: 'UnicodeDecodeError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'UnicodeDecodeError', range },
                { label: 'UnicodeTranslateError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'UnicodeTranslateError', range },
                { label: 'ValueError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'ValueError', range },
                { label: 'ZeroDivisionError', kind: monaco.languages.CompletionItemKind.Class, insertText: 'ZeroDivisionError', range },

                // Common modules (basic import suggestions)
                { label: 'math', kind: monaco.languages.CompletionItemKind.Module, insertText: 'math', range },
                { label: 'random', kind: monaco.languages.CompletionItemKind.Module, insertText: 'random', range },
                { label: 'os', kind: monaco.languages.CompletionItemKind.Module, insertText: 'os', range },
                { label: 'sys', kind: monaco.languages.CompletionItemKind.Module, insertText: 'sys', range },
                { label: 'datetime', kind: monaco.languages.CompletionItemKind.Module, insertText: 'datetime', range },
                { label: 'json', kind: monaco.languages.CompletionItemKind.Module, insertText: 'json', range },
                { label: 're', kind: monaco.languages.CompletionItemKind.Module, insertText: 're', range },
                { label: 'collections', kind: monaco.languages.CompletionItemKind.Module, insertText: 'collections', range },
                { label: 'itertools', kind: monaco.languages.CompletionItemKind.Module, insertText: 'itertools', range },
                { label: 'functools', kind: monaco.languages.CompletionItemKind.Module, insertText: 'functools', range }
            ];

            return { suggestions };
        }
    });
}

// Java autocompletion provider
function setupJavaProvider() {
    monaco.languages.registerCompletionItemProvider('java', {
        provideCompletionItems: function(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const suggestions = [
                // Common methods
                { label: 'System.out.println', kind: monaco.languages.CompletionItemKind.Method, insertText: 'System.out.println(${1:});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'public static void main', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'public static void main(String[] args) {\n\t${1:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Keywords
                { label: 'public', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'public', range },
                { label: 'private', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'private', range },
                { label: 'protected', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'protected', range },
                { label: 'static', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'static', range },
                { label: 'final', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'final', range },
                { label: 'class', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'class ${1:ClassName} {\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'interface', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'interface ${1:InterfaceName} {\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for (${1:int i = 0}; ${2:i < length}; ${3:i++}) {\n\t${4:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while (${1:condition}) {\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'try', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try {\n\t${1:}\n} catch (${2:Exception} e) {\n\t${3:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Data types
                { label: 'String', kind: monaco.languages.CompletionItemKind.Class, insertText: 'String', range },
                { label: 'int', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'int', range },
                { label: 'double', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'double', range },
                { label: 'boolean', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'boolean', range },
                { label: 'ArrayList', kind: monaco.languages.CompletionItemKind.Class, insertText: 'ArrayList<${1:Type}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            ];

            return { suggestions };
        }
    });
}

// C++ autocompletion provider
function setupCppProvider() {
    monaco.languages.registerCompletionItemProvider('cpp', {
        provideCompletionItems: function(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const suggestions = [
                // Common includes
                { label: '#include <iostream>', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '#include <iostream>', range },
                { label: '#include <vector>', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '#include <vector>', range },
                { label: '#include <string>', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '#include <string>', range },
                { label: '#include <algorithm>', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '#include <algorithm>', range },
                
                // Common statements
                { label: 'std::cout', kind: monaco.languages.CompletionItemKind.Function, insertText: 'std::cout << ${1:} << std::endl;', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'std::cin', kind: monaco.languages.CompletionItemKind.Function, insertText: 'std::cin >> ${1:};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'main', kind: monaco.languages.CompletionItemKind.Function, insertText: 'int main() {\n\t${1:}\n\treturn 0;\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Keywords
                { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for (${1:int i = 0}; ${2:i < n}; ${3:++i}) {\n\t${4:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while (${1:condition}) {\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'class', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'class ${1:ClassName} {\npublic:\n\t${2:}\nprivate:\n\t${3:}\n};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Data types
                { label: 'int', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'int', range },
                { label: 'double', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'double', range },
                { label: 'bool', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'bool', range },
                { label: 'string', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'std::string', range },
                { label: 'vector', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'std::vector<${1:type}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            ];

            return { suggestions };
        }
    });
}

// C# autocompletion provider
function setupCSharpProvider() {
    monaco.languages.registerCompletionItemProvider('csharp', {
        provideCompletionItems: function(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const suggestions = [
                // Common statements
                { label: 'Console.WriteLine', kind: monaco.languages.CompletionItemKind.Method, insertText: 'Console.WriteLine(${1:});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'Console.ReadLine', kind: monaco.languages.CompletionItemKind.Method, insertText: 'Console.ReadLine()', range },
                { label: 'Main', kind: monaco.languages.CompletionItemKind.Method, insertText: 'static void Main(string[] args)\n{\n\t${1:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Keywords
                { label: 'public', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'public', range },
                { label: 'private', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'private', range },
                { label: 'protected', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'protected', range },
                { label: 'static', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'static', range },
                { label: 'class', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'class ${1:ClassName}\n{\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'interface', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'interface ${1:InterfaceName}\n{\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition})\n{\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for (${1:int i = 0}; ${2:i < length}; ${3:i++})\n{\n\t${4:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'foreach', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'foreach (${1:var item} in ${2:collection})\n{\n\t${3:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while (${1:condition})\n{\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'try', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try\n{\n\t${1:}\n}\ncatch (${2:Exception} ex)\n{\n\t${3:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Data types
                { label: 'string', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'string', range },
                { label: 'int', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'int', range },
                { label: 'double', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'double', range },
                { label: 'bool', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'bool', range },
                { label: 'var', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'var', range },
                { label: 'List', kind: monaco.languages.CompletionItemKind.Class, insertText: 'List<${1:type}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            ];

            return { suggestions };
        }
    });
}

// Go autocompletion provider
function setupGoProvider() {
    monaco.languages.registerCompletionItemProvider('go', {
        provideCompletionItems: function(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const suggestions = [
                // Common statements
                { label: 'fmt.Println', kind: monaco.languages.CompletionItemKind.Function, insertText: 'fmt.Println(${1:})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'fmt.Printf', kind: monaco.languages.CompletionItemKind.Function, insertText: 'fmt.Printf("${1:%s}", ${2:})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'main', kind: monaco.languages.CompletionItemKind.Function, insertText: 'func main() {\n\t${1:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Keywords
                { label: 'package', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'package ${1:main}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'import', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'import "${1:package}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'func', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'func ${1:name}(${2:params}) ${3:returnType} {\n\t${4:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if ${1:condition} {\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for ${1:i := 0}; ${2:i < n}; ${3:i++} {\n\t${4:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'struct', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'type ${1:Name} struct {\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Data types
                { label: 'int', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'int', range },
                { label: 'string', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'string', range },
                { label: 'bool', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'bool', range },
                { label: 'float64', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'float64', range },
                { label: 'slice', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '[]${1:type}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'map', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'map[${1:keyType}]${2:valueType}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            ];

            return { suggestions };
        }
    });
}

// Rust autocompletion provider
function setupRustProvider() {
    monaco.languages.registerCompletionItemProvider('rust', {
        provideCompletionItems: function(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const suggestions = [
                // Common statements
                { label: 'println!', kind: monaco.languages.CompletionItemKind.Function, insertText: 'println!("${1:}");', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'print!', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print!("${1:}");', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'main', kind: monaco.languages.CompletionItemKind.Function, insertText: 'fn main() {\n\t${1:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Keywords
                { label: 'fn', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'fn ${1:name}(${2:params}) ${3:-> ReturnType} {\n\t${4:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'let', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'let ${1:name} = ${2:value};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'let mut', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'let mut ${1:name} = ${2:value};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if ${1:condition} {\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for ${1:item} in ${2:iterator} {\n\t${3:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while ${1:condition} {\n\t${2:}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'match', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'match ${1:expression} {\n\t${2:pattern} => ${3:result},\n\t_ => ${4:default},\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'struct', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'struct ${1:Name} {\n\t${2:field}: ${3:Type},\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'enum', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'enum ${1:Name} {\n\t${2:Variant},\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Data types
                { label: 'i32', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'i32', range },
                { label: 'i64', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'i64', range },
                { label: 'u32', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'u32', range },
                { label: 'u64', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'u64', range },
                { label: 'f32', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'f32', range },
                { label: 'f64', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'f64', range },
                { label: 'bool', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'bool', range },
                { label: 'String', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'String', range },
                { label: 'Vec', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Vec<${1:T}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'Option', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Option<${1:T}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'Result', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'Result<${1:T}, ${2:E}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            ];

            return { suggestions };
        }
    });
}

// SQL autocompletion provider
function setupSqlProvider() {
    monaco.languages.registerCompletionItemProvider('sql', {
        provideCompletionItems: function(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const suggestions = [
                // SQL Keywords
                { label: 'SELECT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'SELECT ${1:columns} FROM ${2:table}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'INSERT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'INSERT INTO ${1:table} (${2:columns}) VALUES (${3:values})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'UPDATE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'UPDATE ${1:table} SET ${2:column} = ${3:value} WHERE ${4:condition}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'DELETE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DELETE FROM ${1:table} WHERE ${2:condition}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'CREATE TABLE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'CREATE TABLE ${1:table_name} (\n\t${2:column_name} ${3:data_type},\n\t${4:}\n)', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'ALTER TABLE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ALTER TABLE ${1:table_name} ${2:ADD/DROP/MODIFY} ${3:column_definition}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'DROP TABLE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DROP TABLE ${1:table_name}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Clauses
                { label: 'WHERE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'WHERE ${1:condition}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'ORDER BY', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'ORDER BY ${1:column} ${2:ASC/DESC}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'GROUP BY', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'GROUP BY ${1:column}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'HAVING', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'HAVING ${1:condition}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'JOIN ${1:table} ON ${2:condition}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'LEFT JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'LEFT JOIN ${1:table} ON ${2:condition}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'RIGHT JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'RIGHT JOIN ${1:table} ON ${2:condition}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'INNER JOIN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'INNER JOIN ${1:table} ON ${2:condition}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Functions
                { label: 'COUNT', kind: monaco.languages.CompletionItemKind.Function, insertText: 'COUNT(${1:column})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'SUM', kind: monaco.languages.CompletionItemKind.Function, insertText: 'SUM(${1:column})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'AVG', kind: monaco.languages.CompletionItemKind.Function, insertText: 'AVG(${1:column})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'MAX', kind: monaco.languages.CompletionItemKind.Function, insertText: 'MAX(${1:column})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'MIN', kind: monaco.languages.CompletionItemKind.Function, insertText: 'MIN(${1:column})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Data types
                { label: 'VARCHAR', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'VARCHAR(${1:255})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'INT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'INT', range },
                { label: 'DECIMAL', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DECIMAL(${1:10}, ${2:2})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'DATE', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DATE', range },
                { label: 'DATETIME', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'DATETIME', range },
                { label: 'TEXT', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'TEXT', range },
                { label: 'BOOLEAN', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'BOOLEAN', range },
            ];

            return { suggestions };
        }
    });
}

// HTML autocompletion provider
function setupHtmlProvider() {
    monaco.languages.registerCompletionItemProvider('html', {
        provideCompletionItems: function(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const suggestions = [
                // HTML5 Structure
                { label: 'html5', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t${2:}\n</body>\n</html>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Common tags
                { label: 'div', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '<div${1: class="${2:}"}>\n\t${3:}\n</div>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'span', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '<span${1: class="${2:}"}>${3:}</span>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'p', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '<p${1: class="${2:}"}>${3:}</p>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'a', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '<a href="${1:#}"${2: class="${3:}"}>${4:Link text}</a>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'img', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '<img src="${1:}" alt="${2:}" ${3:class="${4:}"}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'button', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '<button${1: type="${2:button}" class="${3:}"}>${4:Button text}</button>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'input', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '<input type="${1:text}" ${2:name="${3:}" placeholder="${4:}" class="${5:}"}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'form', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '<form${1: action="${2:}" method="${3:post}"}>\n\t${4:}\n</form>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'ul', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '<ul${1: class="${2:}"}>\n\t<li>${3:}</li>\n\t<li>${4:}</li>\n</ul>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'ol', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '<ol${1: class="${2:}"}>\n\t<li>${3:}</li>\n\t<li>${4:}</li>\n</ol>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'table', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '<table${1: class="${2:}"}>\n\t<thead>\n\t\t<tr>\n\t\t\t<th>${3:Header}</th>\n\t\t</tr>\n\t</thead>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>${4:Data}</td>\n\t\t</tr>\n\t</tbody>\n</table>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            ];

            return { suggestions };
        }
    });
}

// CSS autocompletion provider
function setupCssProvider() {
    monaco.languages.registerCompletionItemProvider('css', {
        provideCompletionItems: function(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const suggestions = [
                // Common properties
                { label: 'display', kind: monaco.languages.CompletionItemKind.Property, insertText: 'display: ${1:block};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'position', kind: monaco.languages.CompletionItemKind.Property, insertText: 'position: ${1:relative};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'background', kind: monaco.languages.CompletionItemKind.Property, insertText: 'background: ${1:#ffffff};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'color', kind: monaco.languages.CompletionItemKind.Property, insertText: 'color: ${1:#000000};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'font-size', kind: monaco.languages.CompletionItemKind.Property, insertText: 'font-size: ${1:16px};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'font-weight', kind: monaco.languages.CompletionItemKind.Property, insertText: 'font-weight: ${1:normal};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'margin', kind: monaco.languages.CompletionItemKind.Property, insertText: 'margin: ${1:0};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'padding', kind: monaco.languages.CompletionItemKind.Property, insertText: 'padding: ${1:0};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'border', kind: monaco.languages.CompletionItemKind.Property, insertText: 'border: ${1:1px solid #000};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'width', kind: monaco.languages.CompletionItemKind.Property, insertText: 'width: ${1:100%};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'height', kind: monaco.languages.CompletionItemKind.Property, insertText: 'height: ${1:auto};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'text-align', kind: monaco.languages.CompletionItemKind.Property, insertText: 'text-align: ${1:left};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'flex', kind: monaco.languages.CompletionItemKind.Property, insertText: 'flex: ${1:1};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                { label: 'grid', kind: monaco.languages.CompletionItemKind.Property, insertText: 'grid-template-columns: ${1:repeat(auto-fit, minmax(250px, 1fr))};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Flexbox
                { label: 'flexbox', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                
                // Grid
                { label: 'grid-container', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'display: grid;\ngrid-template-columns: ${1:repeat(auto-fit, minmax(250px, 1fr))};\ngap: ${2:1rem};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
            ];

            return { suggestions };
        }
    });
}
