import os
import sys
import json
import shutil

# ====== НАСТРОЙКА ПУТЕЙ ПРОЕКТА ======
PATH_TO_JSON = os.path.join("..", "back", "plants.json")  
PATH_TO_IMAGES = os.path.join("..", "assets", "plants")    
# =====================================

# НОВЫЙ ФОТОРЕАЛИСТИЧНЫЙ ПРОМПТ ДЛЯ MIDJOURNEY
IMAGE_PROMPT_TEMPLATE = (
    "Real authentic photo of a live {plant_img_name}, shot on 35mm lens, f/2.8, "
    "natural imperfections on leaves, matte white ceramic pot. Plain minimal warm beige wall background, "
    "soft daylight from a window, subtle shadows, organic texture, photorealistic, "
    "taken with Canon EOS --ar 1:1 --no 3d, render, clay, plastic, cartoon, illustration, vector, digital art"
)

BACKUP_LLM_PROMPT_TEMPLATE = """Ты — профессиональный ботаник и контент-менеджер приложения Plant Helper. Сгенерируй строго ДОСТОВЕРНУЮ, проверенную и реальную информацию для карточки растения "{rus_name}".

Выдай ответ СТРОГО в формате JSON (без лишнего текста, приветствий и markdown-разметки типа ```json), чтобы я мог распарсить его скриптом:
{{
    "watering": "[реальный режим полива]",
    "light": "[реальные требования к свету]",
    "repotting": "[как часто пересаживать]",
    "toxicity": "[токсично ли для животных]",
    "notes": "[уникальные фичи и особенности ухода]",
    "waterIntervalDays": [число дней между поливами, например: 7],
    "repotIntervalDays": [число дней между пересадками, например: 365]
}}"""

def parse_llm_json(raw_text):
    cleaned = raw_text.strip().replace("```json", "").replace("```", "").strip()
    return json.loads(cleaned)

def save_to_project(rus_name, eng_name, plant_info, source_img_path):
    os.makedirs(PATH_TO_IMAGES, exist_ok=True)
    
    file_slug = eng_name.lower().replace(" ", "_")
    target_img_name = f"{file_slug}.jpg"
    target_img_path = os.path.join(PATH_TO_IMAGES, target_img_name)
    
    # Санитария пути: убираем амперсанды, кавычки, пробелы и особенности PowerShell
    clean_img_path = source_img_path.strip().strip("'\"")
    if clean_img_path.startswith("& "):
        clean_img_path = clean_img_path[2:].strip().strip("'\"")
        
    try:
        shutil.copy(clean_img_path, target_img_path)
        print(f"✅ Картинка успешно скопирована в: {target_img_path}")
    except Exception as e:
        print(f"❌ Ошибка копирования картинки: {e}")
        print(f"Попытался открыть путь: [{clean_img_path}]")
        return

    new_plant_entry = {
        "name": rus_name.capitalize(),
        "watering": plant_info.get("watering", ""),
        "light": plant_info.get("light", ""),
        "repotting": plant_info.get("repotting", ""),
        "toxicity": plant_info.get("toxicity", ""),
        "notes": plant_info.get("notes", ""),
        "waterIntervalDays": plant_info.get("waterIntervalDays", 7),
        "repotIntervalDays": plant_info.get("repotIntervalDays", 365),
        "imageUrl": f"assets/plants/{target_img_name}"  
    }

    try:
        if os.path.exists(PATH_TO_JSON):
            with open(PATH_TO_JSON, "r", encoding="utf-8") as f:
                current_data = json.load(f)
        else:
            current_data = []

        current_data = [p for p in current_data if p["name"].lower() != rus_name.lower()]
        current_data.append(new_plant_entry)

        with open(PATH_TO_JSON, "w", encoding="utf-8") as f:
            json.dump(current_data, f, ensure_ascii=False, indent=2)
            
        print(f"✅ Данные успешно импортированы в базу: {PATH_TO_JSON}")
        print("🚀 Теперь всё корректно подключено, можно проверять на фронтенде!")
    except Exception as e:
        print(f"❌ Ошибка при обновлении JSON-файла: {e}")

def main():
    print("=== CLI-Сборщик контента для Plant Helper ===", flush=True)
    
    rus_name = input("Какое растение добавляем? ").strip().lower()
    if not rus_name: return
    
    eng_name = input("Введите его название на английском (для имени файлов): ").strip()
    if not eng_name: return

    print("\n" + "🎨" * 20)
    print("ШАГ 1: ОБНОВЛЕННЫЙ РЕАЛИСТИЧНЫЙ ПРОМПТ ДЛЯ MIDJOURNEY:")
    print("-" * 40)
    print(IMAGE_PROMPT_TEMPLATE.format(plant_img_name=eng_name))
    
    print("\n" + "🤖" * 20)
    print("ШАГ 2: ПРОМПТ ДЛЯ CHATGPT (JSON):")
    print("-" * 40)
    print(BACKUP_LLM_PROMPT_TEMPLATE.format(rus_name=rus_name.capitalize()))
    print("=" * 40 + "\n")

    confirm = input("Вы сгенерировали картинку и текст? Хотите подключить их к проекту сейчас? (да/нет): ").strip().lower()
    if confirm != "да":
        print("Сборка отменена. 🌱")
        return

    print("\n" + "📥" * 20)
    print("ШАГ 3: ИМПОРТ ФАЙЛОВ В ПРОЕКТ")
    print("-" * 40)
    
    img_path = input("Перетащите файл СКАЧАННОЙ КАРТИНКИ (.jpg) в это окно терминала и нажмите Enter:\n").strip()
    print("\nТеперь скопируйте JSON-ответ от ChatGPT, вставьте его сюда и нажмите Enter:")
    print("(В конце нажмите Ctrl+Z или Ctrl+D для сохранения)")
    
    raw_json = sys.stdin.read()

    try:
        plant_info = parse_llm_json(raw_json)
        save_to_project(rus_name, eng_name, plant_info, img_path)
    except Exception as e:
        print(f"\n❌ Ошибка разбора JSON от ChatGPT. Убедитесь, что скопировали только чистый JSON. Техническая ошибка: {e}")

if __name__ == "__main__":
    main()