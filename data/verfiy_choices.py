import json
import os
import glob

def verify_json_choices(directory_path):
    # Path to search for all .json files
    search_path = os.path.join(directory_path, "*.json")
    files = glob.glob(search_path)
    
    found_errors = False

    for file_path in files:
        file_name = os.path.basename(file_path)
        
        # Skip metadata.json
        if file_name == "metadata.json":
            continue
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            items = data.get("items", [])
            
            for index, item in enumerate(items):
                question_id = item.get("id", f"index_{index}")
                answer = item.get("answer")
                choices = item.get("choices")

                # Only validate if 'choices' exists and is a list
                if isinstance(choices, list):
                    if answer not in choices:
                        print(f"❌ Error in [{file_name}] | Item: {question_id}")
                        print(f"   Answer: '{answer}'")
                        print(f"   Is NOT present in the choices list.")
                        print("-" * 30)
                        found_errors = True
        
        except json.JSONDecodeError:
            print(f"⚠️ Could not parse {file_name}. Check if it is a valid JSON.")
        except Exception as e:
            print(f"⚠️ An error occurred processing {file_name}: {e}")

    if not found_errors:
        print("✅ Validation complete: All answers match their choice lists!")
    else:
        print("Final Status: Errors were found in some files.")

if __name__ == "__main__":
    # Use '.' for the current directory or provide a specific path
    target_dir = "./ai" 
    verify_json_choices(target_dir)
