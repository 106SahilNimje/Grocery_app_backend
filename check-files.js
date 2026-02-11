const fs = require('fs');

try {
    const content = fs.readFileSync('./serviceAccountKey.json', 'utf8');
    const json = JSON.parse(content);
    console.log("serviceAccountKey.json is valid JSON.");
    console.log("Project ID:", json.project_id);
} catch (error) {
    console.error("Error reading serviceAccountKey.json:", error.message);
}
