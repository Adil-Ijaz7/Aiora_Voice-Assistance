let btn=document.querySelector("#btn")
let content=document.querySelector("#content")
let voice=document.querySelector("#voice")

function speak(text){
    let text_speak=new SpeechSynthesisUtterance(text)
    text_speak.rate=0.9
    text_speak.pitch=1
    text_speak.volume=1
    text_speak.lang="hi-GB"
    window.speechSynthesis.speak(text_speak)
}


function wishMe(){
    let day=new Date()
    let hours=day.getHours()
    if(hours>=0 && hours<12){
        speak("Welcome and Good Morning Adil Ijaaz")
    }
    else if(hours>=12 && hours <16){
        speak("Welcome and Good afternoon Adil Ijaaz")
    }else{
        speak("Welcome and Good Evening Adil Ijaaz")
    }
}
 window.addEventListener('load',()=>{
     wishMe()
 })
let speechRecognition= window.SpeechRecognition || window.webkitSpeechRecognition 
let recognition =new speechRecognition()
recognition.onresult=(event)=>{
    let currentIndex=event.resultIndex
    let transcript=event.results[currentIndex][0].transcript
    content.innerText=transcript
   takeCommand(transcript.toLowerCase())
}

btn.addEventListener("click",()=>{
    recognition.start()
    voice.style.display="block"
    btn.style.display="none"
})
function takeCommand(message){
   voice.style.display="none"
    btn.style.display="flex"
    if(message.includes("hello")||message.includes("hey")){
        speak("hello Adil Ijaaz,what can i help you?")
    }
    else if(message.includes("who are you")){
        speak("i am Aiora , a virtual assistant ,developed by Adil Ijaaz")
    }
    else if(message.includes("who developed you")){
        speak("i am developed by Adil Ijaaz , A Front-end Developer and undergraduate student of computer science")
    }
    else if(message.includes("how are you")){
        speak("I'm doing well, thank you for asking! How about you?")
    }
        else if(message.includes("open youtube")){
        speak("opening youtube...")
        window.open("https://youtube.com/","_blank")
    }
    else if(message.includes("open google")){
        speak("opening google...")
        window.open("https://google.com/","_blank")
    }
    else if(message.includes("open facebook")){
        speak("opening facebook...")
        window.open("https://facebook.com/","_blank")
    }
    else if(message.includes("open instagram")){
        speak("opening instagram...")
        window.open("https://instagram.com/","_blank")
    }
    else if(message.includes("open spotify")){
        speak("opening spotify...")
        window.open("https://open.spotify.com/","_blank")
    }
    else if(message.includes("open whatsapp")){
        speak("opening whatsapp..")
        window.open("https://web.whatsapp.com/","_blank")
    }
    else if (message.includes("open microsoft store")) {
        speak("Opening Microsoft Store...");
        window.open("ms-windows-store://home", "_blank")
    } 
    else if (message.includes("open linkedin")) {
        speak("Opening LinkedIn...");
        window.open("https://www.linkedin.com/feed/", "_blank")
    } 
    else if (message.includes("open chat gpt")) {
        speak("Opening ChatGPT...");
        window.open("https://chat.openai.com/chat", "_blank")
    } 
    else if (message.includes("play")) {
        let song = message.replace("play", "").trim();  // Extract song name from the command
        if (song) {
            speak(`Playing ${song} on Spotify...`);
            let searchUrl = `https://open.spotify.com/search/${encodeURIComponent(song)}`;
            window.open(searchUrl, "_blank");
        } else {
            speak("Please specify a song to play.");
        }
    }
    else if(message.includes("time")){
      let time=new Date().toLocaleString(undefined,{hour:"numeric",minute:"numeric"})
      speak(time)
    }
    else if(message.includes("date")){
        let date=new Date().toLocaleString(undefined,{day:"numeric",month:"short"})
        speak(date)
      }
    else{
        let finalText="this is what i found on internet regarding" + message.replace("Aiora","") || message.replace("Aiora","")
        speak(finalText)
        window.open(`https://www.google.com/search?q=${message.replace("Aiora","")}`,"_blank")
    }
}