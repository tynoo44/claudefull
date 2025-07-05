import React from 'react';

interface MessageContentProps {
  content: string;
  className?: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, className = '' }) => {
  // Convert markdown-like syntax to HTML
  const formatContent = (text: string): string => {
    let formatted = text;
    
    // Handle special message suggestion format
    formatted = formatted.replace(/📝 \*\*Opción (\d+).*?\*\*:(.*?)```([\s\S]*?)```/g, (match, num, desc, message) => {
      const descClean = desc.trim().replace(/[()]/g, '');
      const messageClean = message.trim();
      return `
      <div class="my-6 border rounded-lg overflow-hidden bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700 shadow-md">
        <div class="px-4 py-3 bg-purple-100 dark:bg-purple-800/30 border-b border-purple-200 dark:border-purple-700">
          <div class="flex items-center gap-3">
            <span class="text-lg">📝</span>
            <strong class="text-purple-900 dark:text-purple-200 text-base">Opción ${num}</strong>
            <span class="text-sm text-purple-700 dark:text-purple-300">${descClean}</span>
          </div>
        </div>
        <div class="p-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 font-mono text-sm border border-purple-100 dark:border-gray-700 shadow-sm">
            <div class="select-all cursor-text hover:bg-purple-50 dark:hover:bg-purple-900/10 -m-4 p-4 rounded-lg transition-colors whitespace-pre-wrap break-words overflow-hidden">
              ${messageClean}
            </div>
          </div>
          <div class="mt-3 text-xs text-purple-600 dark:text-purple-400 text-center font-medium">💾 Click para seleccionar • Copia y pega en tu chat</div>
        </div>
      </div>`;
    });
    
    // Special sections
    formatted = formatted.replace(/\*\*POR QUÉ ESTAS OPCIONES\*\*:/g, 
      '<div class="mt-6 mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">' +
      '<div class="font-bold text-blue-900 dark:text-blue-200 mb-2">💡 Por qué estas opciones:</div>');
    
    // Close the special section div after its content
    formatted = formatted.replace(/(\*\*POR QUÉ ESTAS OPCIONES\*\*:[\s\S]*?)(?=\n\n|$)/g, (match) => {
      return match + '</div>';
    });
    
    // Section headers with better styling
    formatted = formatted.replace(/\*\*([^*]+)\*\*:/g, '<div class="font-bold text-base mt-6 mb-3 text-purple-900 dark:text-purple-200 border-b border-purple-200 dark:border-purple-700 pb-2">$1:</div>');
    
    // Bold text: **text** or __text__
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic text: *text* or _text_
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Headers
    formatted = formatted.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">$1</h3>');
    formatted = formatted.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">$1</h2>');
    formatted = formatted.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">$1</h1>');
    
    // Horizontal line
    formatted = formatted.replace(/^---$/gm, '<hr class="my-4 border-current opacity-20" />');
    
    // Code blocks with triple backticks (avoid those already processed)
    formatted = formatted.replace(/```([\s\S]*?)```/g, (match, code) => {
      // Skip if it's already inside a formatted option
      if (match.includes('class=')) return match;
      return `<div class="bg-gray-900 text-gray-100 rounded-lg p-4 my-3 overflow-hidden"><pre class="text-sm whitespace-pre-wrap break-words"><code>${code.trim()}</code></pre></div>`;
    });
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>');
    
    // Lists with better styling
    formatted = formatted.replace(/^\* {2}(.*?)$/gm, '<li class="ml-6 list-disc">$1</li>');
    formatted = formatted.replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>');
    formatted = formatted.replace(/^\* (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>');
    formatted = formatted.replace(/^\d+\. (.*?)$/gm, '<li class="ml-4 list-decimal">$1</li>');
    
    // Wrap consecutive list items
    formatted = formatted.replace(/(<li class="ml-[46] list-(?:disc|decimal)">.*?<\/li>(?:<br \/>)?)+/g, (match) => {
      const isNumbered = match.includes('list-decimal');
      const tag = isNumbered ? 'ol' : 'ul';
      return `<${tag} class="my-2 space-y-1">${match}</${tag}>`;
    });
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br />');
    
    // Replace emoji shortcuts
    formatted = formatted.replace(/📝/g, '📝');
    formatted = formatted.replace(/📊/g, '📊');
    formatted = formatted.replace(/💡/g, '💡');
    formatted = formatted.replace(/🎯/g, '🎯');
    formatted = formatted.replace(/✅/g, '✅');
    formatted = formatted.replace(/❗/g, '❗');
    formatted = formatted.replace(/💬/g, '💬');
    
    return formatted;
  };

  const formattedContent = formatContent(content);

  return (
    <div 
      className={`message-content leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};