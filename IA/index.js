import {
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory
} from "@google/generative-ai";
 
const MODEL_NAME = "gemini-1.0-pro";
 
const API_KEY = "AIzaSyDkCf25idJfNAEX4qFCRUh7k2beoHB8c3Y";
 
const GENERATION_CONFIG = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
};
 
const SAFETY_SETTINGS = [{
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
},
{
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
},
{
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
},
{
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
},
];
 
export async function runChat(input) {
    const EducaIA = new GoogleGenerativeAI(API_KEY);

    const model = EducaIA.getGenerativeModel({
        model: MODEL_NAME
    });

    const chat = model.startChat({
        generationConfig: GENERATION_CONFIG,
        safetySettings: SAFETY_SETTINGS,
        history: [],
    }); 
    
    if(input) {
        const message = await chat.sendMessage(input);
        const chatresponse = message.response.text();
        return chatresponse;
    }
}
 
runChat();