const vkeasy = require("easyvk");
const Discord = require("discord.js");
const collage = require("collage");
const config = require("./config.json");

const client = new Discord.Client();
client.login(config.BOT_TOKEN);

function getUrls(attachments) {
  const urls = [];
  attachments.forEach((file) => {
    if (file.type === "photo") {
      const { sizes } = file.photo;
      urls.push(sizes[sizes.length - 1].url);
    } else if (file.type === "doc") {
      urls.push(file.doc.url);
    } else if(file.type === "video") {

      const images = file.video.image;
      const prev = images[images .length - 1].url
      urls.push(prev);
    }
  });

  return urls;
}

vkeasy({
  token: config.USER_TOKEN,
}).then(async (vk) => {
  async function analyzeLink(url) {
    const result = {};
    result.images = [];
    result.videos = [];
    result.text = "";

    if (url.includes("photo")) {
      const { id } = url.match(/photo(?<id>-?[0-9_]*)/).groups;
      const res = await vk.call("photos.getById", {
        photos: [id],
      });
      const { sizes } = res[0];

      result.text = res[0].text;
      result.images.push(sizes[sizes.length - 1].url);
    } else if (url.includes("wall")) {
      const { id } = url.match(/wall(?<id>-?[0-9_]*)/).groups;
      const res = await vk.call("wall.getById", {
        posts: [id],
      });

      const { attachments } = res[0];

      const urls = getUrls(attachments);

      if (urls) {
        result.images = urls;
      }

      result.text = res[0].text;
    } else if(url.includes('video')) {
      // const { id } = url.matchAll(/video(?<id>-?[0-9_]*)/g);
      let ex = /video(?<id>-?[0-9_]+)/;
      const { id } = url.match(ex).groups;
      // match = ex.exec(url);
      // console.log(match);
      // console.log(ex);
      
      
      const owner_id = id.match(/[-\d]*/)[0];
      const vieoId = id.replace((owner_id + '_'), '');
      const res = await vk.call("video.get", {
        "videos": [ex.exec(url).groups.id],
      });
      const images = res.items[0].image;
      const prev = images[images .length - 1].url
      result.images.push(prev);
      result.text = '??????????: ' + res.items[0].title;
    }

    return result;
  }

  client.on("message", async (message) => {
    if (message.author.bot) return;
    if (message.content.includes("https://vk.com")) {
      const data = await analyzeLink(message.content);
      if (data.videos.length || data.images.length || data.text !== "") {
        const embed = new Discord.MessageEmbed();

        if(data.text){
          embed.setDescription(data.text)
        }

        if (data.images.length === 1) {
          // const embed = new Discord.MessageEmbed()
          embed.setImage(data.images[0])

          message.channel.send(embed);
        } else {
          if(data.images.length) {
            const buffer = await collage({
              images: data.images,
              gap: 10,
              cols: 3,
              width: 1000,
              background: 0xffffffff,
            });
            const attachment = new Discord.MessageAttachment(
              buffer,
              "collage.png"
            );
            embed.attachFiles(attachment).setImage("attachment://collage.png");
            }
          message.channel.send(embed);
        }
      }
    }
  });
});
