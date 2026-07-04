import os
import re

def remove_comments_from_code(code_text: str) -> str:
    """Безопасно удаляет комментарии, игнорируя строки и JS Regular Expressions."""
    # Паттерн защищает:
    # 1. Строки в любых кавычках: "", '', ``
    # 2. Регулярные выражения JS вида /.../ (чтобы не путать // внутри RegExp с комментарием)
    # И находит комментарии: //... и /*...*/
    pattern = re.compile(
        r'(\".*?\"|\'.*?\'|`.*?`|/(?!\*)[^/\n]+/(?=[gimy]*[^\w]))|(/\*.*?\*/|//.*?$)', 
        re.DOTALL | re.MULTILINE
    )
    
    def replacer(match):
        # Если совпала первая группа (строка или регулярка JS) — возвращаем её как есть
        if match.group(1) is not None:
            return match.group(1)
        # Если совпал комментарий — полностью удаляем его text
        return ""

    return pattern.sub(replacer, code_text)

def process_js_file(file_path: str):
    """Читает .js файл, чистит его от комментариев и перезаписывает без изменения строк."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        clean_content = remove_comments_from_code(content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(clean_content)
            
        print(f"[ОЧИЩЕН]: {file_path}")
    except Exception as e:
        print(f"[ОШИБКА] Не удалось обработать {file_path}: {e}")

def clean_only_js_files(folder_path: str):
    """Рекурсивно обходит указанную папку и обрабатывает файлы .js."""
    folder_path = os.path.abspath(folder_path)
    
    if not os.path.exists(folder_path):
        print(f"[ОШИБКА] Указанный путь не существует: {folder_path}")
        return

    print(f"\nНачинаю безопасный обход папки: {folder_path}")
    counter = 0
    for root, dirs, files in os.walk(folder_path):
        if any(ignored in root.split(os.sep) for ignored in ['node_modules', '.git']):
            continue
            
        for file in files:
            if file.endswith('.js'):
                full_path = os.path.join(root, file)
                process_js_file(full_path)
                counter += 1
                
    print(f"\nГотово! Всего обработано файлов: {counter}")

if __name__ == "__main__":
    print("--- Безопасная утилита очистки .js файлов ---")
    user_input = input("Введите путь к папке (или нажмите Enter для текущей папки): ").strip()
    start_dir = user_input if user_input else os.getcwd()
    clean_only_js_files(start_dir)
