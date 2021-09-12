const vkeasy = require('easyvk');
const Discord = require('discord.js');
const config = require('./config.json');
const collage = require('collage')
const fs  = require('fs');

let client = new Discord.Client();
client.login(config.BOT_TOKEN);

function getUrls(attachments) {

    let urls = [];
    attachments.forEach(file => {
        
        if(file.type == 'photo') {
            let sizes = file.photo.sizes;
            urls.push(sizes[sizes.length - 1].url);
        } else if(file.type == 'doc') {
            urls.push(file.doc.url);
        }
    });

    return urls;
}

vkeasy({
    token: config.SERVICE_CODE
}).then(vk => {
    

    client.on('message', function(message) {
        if(message.author.bot) return;

        if(message.content.startsWith('https://vk.com/wall-')) {
            let id = message.content.match(/wall(?<id>-[0-9_]*)/).groups.id;
            console.log(id)
            vk.call('wall.getById', {
                posts: [id]
            }).then(async res => {
                console.log(res);

                console.log(res[0]['copy_history']);

                let text = res[0].text;
                let attachments = res[0].attachments;
                let urls = null
                if(attachments) {
                    urls = getUrls(attachments);    
                }
                
                let reply = new Discord.Message();
                if(text){
                    collage({
                        images: urls,
                        width: 1000,
                        cols: 3
                    }).then((buffer) => {
                        // fs.writeFileSync('./tmp.png', buffer);

                        message.channel.send(text, {
                            files: [ buffer ]
                        })
                    })

                    
                }
                    
            })
        }

        // https://vk.com/video-99126464_456305117
        // https://vk.com/video?z=video-1672730_456240218%2Fpl_cat_trends
        // if(message.content.startsWith('https://vk.com/video')) {
        //     // let videoId = message.content.replace('https://vk.com/video', '');
        //     let videoId = message.content.match(/video(?<id>-?[0-9_]*)/).groups.id;
        //     console.log(videoId);
        //     vk.call('video.get', {
        //         videos: videoId,
        //         'owner_id': ''
        //     }).then(function(response) {
        //         // console.log(response);
        //         let video = response.items[0];
        //         let embed = new Discord.MessageEmbed().setImage(video.image[video.image.length - 1].url).setDescription(video.description);
        //         message.reply(embed);
        //     });
        // }
    })

});
