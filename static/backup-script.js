// Updated script.js with reasoning support


export function detectLanguage(code) {
    const patterns = [
      { lang: "javascript", regex: /\b(function|const|let|var|=>|console\.log|import |export |document\.|window\.|async|await|fetch|Promise)\b/g, weight: 2 },
      { lang: "python",   regex: /\b(def |import |from |print\(|class |self\.|lambda |async def |if __name__ == ["']__main__["']|try:|except |with |open\()/g, weight: 2 },
      { lang: "php",      regex: /<\?php|echo\s+["'].*["'];|function\s+\w+\(|\$[a-zA-Z_][a-zA-Z0-9_]*\s*=/g, weight: 5 },
      { lang: "java",     regex: /\b(public|private|protected|class\s+\w+|static\s+void\s+main|System\.out\.println|import\s+java\.)\b/g, weight: 3 },
      { lang: "c",        regex: /\b(#include\s+<.+?>|int\s+main\(\)|printf\(|scanf\(|return\s+\d+;)\b/g, weight: 3 },
      { lang: "cpp",      regex: /\b(#include\s+<.+?>|std::cout|cout|cin|std::cin|std::vector|std::string|namespace\s+\w+|class\s+\w+|new |delete |->)\b/g, weight: 3 },
      { lang: "html",     regex: /<\s*(!DOCTYPE\s+html|html|head|body|div|span|p|a|img|script|link|meta|title|h[1-6])[\s>]/gi, weight: 3 },
      { lang: "css",      regex: /\b(color|background|margin|padding|font-size|display|position|grid|flex|justify-content|align-items|border|width|height)\s*:[^;]+;/g, weight: 2 },
      { lang: "yaml",     regex: /^(?!.*;)\s*[A-Za-z0-9_-]+:\s+[^:\n]+$/gm, weight: 3 },
      { lang: "json",     regex: /^\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*$/gm, weight: 3 },
      { lang: "bash",     regex: /(^#!\/bin\/bash)|\b(echo|cd|ls|rm|grep|chmod|chown|sudo|export|alias|source|curl|wget)\b/g, weight: 3 },
      { lang: "ruby",     regex: /\b(def |class |module |end|puts |require |include |attr_accessor |begin |rescue |elsif |unless)\b/g, weight: 2 },
      { lang: "swift",    regex: /\b(let |var |func |print\(|import Foundation|class |struct |enum |if |else |switch |case |guard |defer)\b/g, weight: 2 },
      { lang: "go",       regex: /\b(package |import |func |defer |go |chan |interface |map |struct |type |var |fmt\.)\b/g, weight: 3 },
      { lang: "kotlin",   regex: /\b(fun |val |var |class |object |companion |data class |import |when |is |as |println\()/g, weight: 2 },
      { lang: "typescript",regex:/\b(let|const|var|function|interface\s+\w+|type\s+\w+\s*=|enum\s+\w+|public |private |readonly |implements)\b/g, weight: 2 },
      { lang: "sql",      regex: /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|GROUP BY|ORDER BY|LIMIT|HAVING)\b/gi, weight: 3 },
      { lang: "xml",      regex: /^\s*<\?xml\b[^>]*\?>/g, weight: 3 },
      { lang: "dockerfile",regex:/\b(FROM |RUN |CMD |LABEL |EXPOSE |ENV |ADD |COPY |ENTRYPOINT |WORKDIR |VOLUME)\b/g, weight: 3 },
      { lang: "makefile", regex: /^[a-zA-Z0-9_-]+:\s*\n\s*(\t|\s{4})\w+/gm, weight: 3 }
    ];
  
    let scores = {};
    for (const { lang, regex, weight } of patterns) {
      const matchCount = (code.match(regex) || []).length;
      if (matchCount) scores[lang] = (scores[lang] || 0) + matchCount * weight;
    }
  
    const detected = Object.keys(scores).reduce((best, lang) => {
      if (best === null || scores[lang] > scores[best]) return lang;
      return best;
    }, null);
  
    return detected || "markdown";
  }
  
  // --- TABLE HELPERS ---
  function splitRow(row) {
    let r = row.trim();
    if (r.startsWith('|')) r = r.slice(1);
    if (r.endsWith('|')) r = r.slice(0, -1);
    return r.split('|').map(c => c.trim());
  }
  
  function isTableSeparator(line) {
    const cells = splitRow(line).filter(c => c.length);
    return cells.length && cells.every(c => /^:?-{3,}:?$/.test(c));
  }
  
  function parseTableBlock(header, sep, rows) {
    const headers = splitRow(header);
    const aligns = splitRow(sep).map(cell => {
      if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
      if (cell.startsWith(':')) return 'left';
      if (cell.endsWith(':')) return 'right';
      return 'left';
    });
    let thead = '<thead><tr>' + headers.map((h,i) => `<th class="align-${aligns[i]||'left'}">${h}</th>`).join('') + '</tr></thead>';
    let tbody = '<tbody>' + rows.map(r => {
      const cells = splitRow(r);
      return '<tr>' + headers.map((_,i) => `<td class="align-${aligns[i]||'left'}">${cells[i]||''}</td>`).join('') + '</tr>';
    }).join('') + '</tbody>';
    return `<table class="chatgpt-table">${thead}${tbody}</table>`;
  }
  
  function handleTableFormatting(text) {
    const lines = text.split('\n');
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('|') && lines[i+1] && isTableSeparator(lines[i+1])) {
        const header = lines[i], sep = lines[i+1];
        const rows = [];
        i += 2;
        while (lines[i] && lines[i].includes('|')) { rows.push(lines[i++]); }
        out.push(parseTableBlock(header, sep, rows));
        i--;
      } else out.push(lines[i]);
    }
    return out.join('\n');
  }
  
  // --- ESCAPE HTML ---
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }
  
  // --- REASONING PARSER ---
  // --- REASONING PARSER — improved streaming support ---
  function parseReasoning(text) {
    const thinkingBlocks = [];
    // Matches each <think>…</think> or an unterminated <think>… at end-of-string
    text = text.replace(
      /<think>([\s\S]*?)(?:<\/think>|$)/g,
      (match, content) => {
        // complete if we actually saw a closing tag
        const complete = /<\/think>$/.test(match);
        thinkingBlocks.push({ content: content.trim(), complete });
        return `@@THINK${thinkingBlocks.length - 1}@@`;
      }
    );
    return { text, thinkingBlocks };
  }
  
  
  
  // --- STREAMING CODE BLOCK PARSER ---
  export function parseMarkdown(text) {
    const codeBlocks = [], inlineCodes = [];
    
    // Parse reasoning blocks first
    const { text: reasoningParsedText, thinkingBlocks } = parseReasoning(text);
    text = reasoningParsedText;
  
    // Handle streaming and complete code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      codeBlocks.push({ lang: lang || detectLanguage(code), code, complete: true });
      return `@@CB${codeBlocks.length-1}@@`;
    });
    text = text.replace(/```(\w+)?\n([\s\S]*)$/gm, (match, lang, code) => {
      const before = text.slice(0, text.indexOf(match));
      const openCount = (before.match(/```/g) || []).length;
      if (openCount % 2 === 0) {
        codeBlocks.push({ lang: lang || detectLanguage(code), code, complete: false });
        return `@@CB${codeBlocks.length-1}@@`;
      }
      return match;
    });
  
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, (_, c) => {
      inlineCodes.push(c);
      return `@@IC${inlineCodes.length-1}@@`;
    });
  
    // Escape HTML
    text = escapeHtml(text);
  
    text = text.replace(
      /\\begin\{(bmatrix|pmatrix)\}([\s\S]+?)\\end\{\1\}/g,
      '<div class="math-block">\\[$0\\]</div>'
    );
    text = text.replace(
      /(?<=\W|^)(\d+)\/(\d+)(?=\W|$)/g,
      '<span class="math-inline">\\($1/$2\\)</span>'
    );
    text = text.replace(/\\\[((?:.|\n)+?)\\\]/g, '<div class="math-block">\\[$1\\]</div>');
    text = text.replace(/\\\((.+?)\\\)/g, '<span class="math-inline">\\($1\\)</span>');
    // Math Blocks (KaTeX)
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, '<div class="math-block">\\[$1\\]</div>');
    text = text.replace(/\$([^\$]+?)\$/g, '<span class="math-inline">\\($1\\)</span>');
    // Format block math environments: \[ ... \]
    
  
    
  function convertYouTubeLinksToThumbnails(text) {
      // Regex to capture various YouTube video IDs
      // Group 1: The custom ID (e.g., #1, #2) - not used for video/thumbnail URLs
      // Group 2: The actual YouTube video ID (11 characters, alphanumeric, hyphen, underscore)
      const customYouTubeRegex = /\|\s*#(\d+)\s*\|\s*\((?:https?:\/\/(?:www\.)?(?:m\.)?)?(?:youtube\.com(?:\/watch\?v=|\/embed\/|\/v\/|\/shorts\/)|youtu\.be\/|googleusercontent\.com\/youtube\.com\/\d{1}\/[a-zA-Z0-9_-]+\/)([a-zA-Z0-9_-]{11})(?:\S+)?\)/g;
  
      return text.replace(customYouTubeRegex, (match, customId, youtubeVideoId) => {
          // Construct the standard YouTube video URL
          const videoUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;
          // Construct the standard YouTube thumbnail URL (using hqdefault for good quality)
          const thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
  
          // Return the HTML for the thumbnail preview div
          return `
            <div class="youtube-thumbnail-preview">
              <a href="${videoUrl}" target="_blank" rel="noopener noreferrer">
                <img src="${thumbnailUrl}" alt="YouTube video thumbnail">
                <div class="play-button"><div class="play-button-bg">▶</div></div>
              </a>
            </div>
          `;
      });
  }
  
  
  text = convertYouTubeLinksToThumbnails(text);
  
  text = text.replace(/\|\s*#\d+\s*\|\s*\(\s*(https?:\/\/[^)]+?)\s*\)/g, (match, url) => {
      try {
          const domain = new URL(url).hostname;
          // Construct the HTML for the clickable logo
          return `
              <a href="${url}" target="_blank" class="source-link">
                  <img src="https://www.google.com/s2/favicons?sz=32&domain=${domain}" class="logo" alt="Favicon for ${domain}" onerror="this.onerror=null;this.src='https://placehold.co/32x32/cccccc/ffffff?text=?'">
                  <span>${domain}</span>
              </a>
          `;
      } catch (e) {
          console.error("Invalid URL detected:", url, e);
          return `[Invalid Link: ${url}]`; // Fallback for malformed URLs
      }
  });
  
  
  const regex = /^:::\(src\)([\s\S]*?):::\(src\)\n*/gm;
  text= text.replace(regex, '<div class="src-con" id="srcCon" >$1<span class="src-con-txt">Sources</span></div><br>');
  
  text = text.replace(/\[\[!\]\]\((https?:\/\/[^)]+)\)/g, (match, url) => {
    try {
        const domain = new URL(url).hostname;
        // Construct the HTML for the clickable logo
        return `
            <a href="${url}" target="_blank" class="source-link-r">
                <img src="https://www.google.com/s2/favicons?sz=32&domain=${domain}" class="logo" alt="Favicon for ${domain}" onerror="this.onerror=null;this.src='https://placehold.co/32x32/cccccc/ffffff?text=?'">
            </a>
        `;
    } catch (e) {
        console.error("Invalid URL detected:", url, e);
        return `[Invalid Link: ${url}]`; // Fallback for malformed URLs
    }
  });
  
  
  
  
  
  // Optional: Wrap equations with `\[ ... \]` or `$$ ... $$` inside <pre> if from code input
  // Or sanitize/escape HTML elsewhere before parsing if needed
  
  
    // Admonitions
    text = text.replace(/^:::(note|warning|tip)\s*$/gm, '<div class="$1 admonition">');
    text = text.replace(/^:::\s*$/gm, '</div>');
  
    // Task Lists
    text = text.replace(/^- \[ \] (.*)$/gm, '<li class="task-list-item"><input type="checkbox" disabled> $1</li>');
    text = text.replace(/^- \[x\] (.*)$/gm, '<li class="task-list-item"><input type="checkbox" checked disabled> $1</li>');
    text = text.replace(/(<li class="task-list-item".*?<\/li>)/gs, (m) => `<ul class="task-list">${m}</ul>`);
  
    // Handle table formatting
    text = handleTableFormatting(text);
  
    // Headings
    text = text.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>')
               .replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>')
               .replace(/^####\s+(.*)$/gm, '<h4>$1</h4>')
               .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
               .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
               .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');
  
    // Formatting
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\*/g, '<em>$1</em>')
               .replace(/~~(.*?)~~/g, '<del>$1</del>')
               .replace(/__(.*?)__/g, '<u>$1</u>')
  
  
    // Blockquotes, HR, Links, Lists
    text = text.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>')
               .replace(/^---$/gm, '<hr>')
               .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
               .replace(/^\*\s+(.*)$/gm, '<li>$1</li>')
               .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
               .replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>')
               .replace(/(<ol>.*?<\/ol>)/gs, '<ol>$1</ol>');
    
    
  
    text = '<p>' + text.replace(/\n\n+/g, '</p><p>') + '</p>';
    text = text.replace(/<p><\/p>/g, '');
  
    // Restore inline codes
    text = text.replace(/@@IC(\d+)@@/g, (_, i) => `<code>${escapeHtml(inlineCodes[i])}</code>`);
  
  // --- RESTORING THINKING BLOCKS in parseMarkdown() ---
    text = text.replace(/@@THINK(\d+)@@/g, (_, i) => {
    const { content, complete } = thinkingBlocks[i];
    // choose label and animation based on whether we closed the block
    const label = complete ? 'Thought result' : 'Thinking';
    const animation = complete
      ? ''
      : `<div class="thinking-animation">
           <div class="thinking-dot"></div>
           <div class="thinking-dot"></div>
           <div class="thinking-dot"></div>
         </div>`;
  
    return `<div class="thinking-block ${complete ? 'complete' : 'streaming'}">
      <button class="thinking-toggle" onclick="toggleThinking(this)"><div class="thinking-header">
  
        <div><span class="thinking-label">${label}</span>${animation}</div>
        <div><svg class="thinking-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg></div>
          </div>
        </button>
      
      <div class="thinking-content">
        ${parseMarkdown(content)}
      </div>
    </div>`;
  });
  
  
    // Restore code blocks
    text = text.replace(/@@CB(\d+)@@/g, (_, i) => {
      const { lang, code, complete } = codeBlocks[i];
      const statusClass = complete ? 'complete' : 'streaming';
      const streamingIndicator = complete ? '' : '<span class="streaming-indicator">●</span>';
      if (lang === 'mermaid') {
        return `<div class="mermaid">${escapeHtml(code)}</div>`;
      }
      return `<div class="code-container ${statusClass}">
        <div class="code-header">
          <span class="language-label">${lang.toLowerCase()}</span>
          ${streamingIndicator}
          <button class="copy-button" data-index="${i}"><svg width="13px" height="13px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7.5 3H14.6C16.8402 3 17.9603 3 18.816 3.43597C19.5686 3.81947 20.1805 4.43139 20.564 5.18404C21 6.03969 21 7.15979 21 9.4V16.5M6.2 21H14.3C15.4201 21 15.9802 21 16.408 20.782C16.7843 20.5903 17.0903 20.2843 17.282 19.908C17.5 19.4802 17.5 18.9201 17.5 17.8V9.7C17.5 8.57989 17.5 8.01984 17.282 7.59202C17.0903 7.21569 16.7843 6.90973 16.408 6.71799C15.9802 6.5 15.4201 6.5 14.3 6.5H6.2C5.0799 6.5 4.51984 6.5 4.09202 6.71799C3.71569 6.90973 3.40973 7.21569 3.21799 7.59202C3 8.01984 3 8.57989 3 9.7V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.0799 21 6.2 21Z" stroke="currentColor" stroke-width="" stroke-linecap="round" stroke-linejoin="round"/>
  </svg></button>
        </div>
        <pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>
      </div>`;
    });
  
    return text;
  }
  
  // Add global function for thinking toggle
  window.toggleThinking = function(button) {
    const thinkingBlock = button.closest('.thinking-block');
    const content = thinkingBlock.querySelector('.thinking-content');
    const chevron = button.querySelector('.thinking-chevron');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      chevron.style.transform = 'rotate(0deg)';
    } else {
      content.style.display = 'none';
      chevron.style.transform = 'rotate(-90deg)';
    }
  };
  
  // --- COPY BUTTON HANDLER ---
  document.addEventListener('click', e => {
    if (e.target.closest('.copy-button')) {
      const btn = e.target.closest('.copy-button');
      const idx = btn.dataset.index;
      const codeEl = document.querySelectorAll('.code-container pre code')[idx];
      
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.innerText);
  
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="icon copied" viewBox="0 0 24 24" width="13" height="12" fill="currentColor">
            <path d="M20.285 6.709l-11.025 11.025-5.543-5.543 1.414-1.414 4.129 4.129 9.611-9.611z"/>
          </svg>
        `;
  
        setTimeout(() => {
          btn.innerHTML = `
           <svg width="12px" height="12px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7.5 3H14.6C16.8402 3 17.9603 3 18.816 3.43597C19.5686 3.81947 20.1805 4.43139 20.564 5.18404C21 6.03969 21 7.15979 21 9.4V16.5M6.2 21H14.3C15.4201 21 15.9802 21 16.408 20.782C16.7843 20.5903 17.0903 20.2843 17.282 19.908C17.5 19.4802 17.5 18.9201 17.5 17.8V9.7C17.5 8.57989 17.5 8.01984 17.282 7.59202C17.0903 7.21569 16.7843 6.90973 16.408 6.71799C15.9802 6.5 15.4201 6.5 14.3 6.5H6.2C5.0799 6.5 4.51984 6.5 4.09202 6.71799C3.71569 6.90973 3.40973 7.21569 3.21799 7.59202C3 8.01984 3 8.57989 3 9.7V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.0799 21 6.2 21Z" stroke="currentColor" stroke-width="" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
          `;
        }, 2000);
      }
    }
  });