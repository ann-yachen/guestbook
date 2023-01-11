const form = document.getElementById('form');
const messages = document.getElementById('messages');
const loading = document.getElementById('loading');

const MessageModel = {
    post: function(formData){
        (async () => {
            const requestOptions = {
                method: 'POST',
                // No needed to set headers for multer
                body: formData
            };
            try{
                const response = await fetch('/api/message', requestOptions);
                const result = await response.json();
                if(result.ok === true){
                    MessageView.reloadPage();
                }
            }catch(err){
                console.log(err);
            }
        })();
    },

    get: function(){
        (async () => {
            const response = await fetch('/api/message');
            const result = await response.json();
            MessageView.showMessages(result);
        })();
    }
};

const MessageView = {
    renderMessage: function(data){
        const message = document.createElement('div');
        message.className = 'card';

        const messageImage = document.createElement('img');
        messageImage.className = 'card-image-left';
        const imageURL = 'https://d6wclof90dzcg.cloudfront.net/' + data.image;
        messageImage.setAttribute('src', imageURL);

        const messageText = document.createElement('div');
        messageText.className = 'card-text';
        messageText.textContent = data.message;

        message.append(messageImage, messageText);
        
        return message;
    },

    showMessages: function(result){
        const messagesData = result.data;
        const messagesFragment = document.createDocumentFragment();

        for(let i = 0; i < messagesData.length; i++){
            let message = MessageView.renderMessage(messagesData[i]);
            messagesFragment.prepend(message);
        }
        messages.appendChild(messagesFragment);
        MessageView.loadingMessages(false);
    },

    loadingMessages: function(isLoading){
        loading.style.display = isLoading ? 'block' : 'none';
    },

    reloadPage: function(){
        window.location.href = "/";
    }
};

const MessageController = {
    init: function(){
        MessageModel.get();
        form.addEventListener('submit', MessageController.sendMessage);
    },

    sendMessage: function(e){
        e.preventDefault();
        let message = document.getElementById('message');
        let image = document.getElementById('image');
        let formData = new FormData();
        formData.append('message', message.value);
        formData.append('image', image.files[0]);
        MessageModel.post(formData);
    } 
};

MessageController.init();