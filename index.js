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
      const { id } = url.match(/video(?<id>-?[0-9_]*)/).groups;
      const owner_id = id.match(/[-\d]*/)[0];
      const vieoId = id.replace((owner_id + '_'), '');
      const res = await vk.call("video.get", {
        owner_id,
        videos: [id],
      });

      let images = res.items[0].image;
      const prev = images[images .length - 1].url
      result.images.push(prev);
      result.text = 'ВИДЕО: ' + res.items[0].title;
    }

    return result;
  }

  client.on("message", async (message) => {
    if (message.author.bot) return;
    if (message.content.includes("https://vk.com")) {
      const data = await analyzeLink(message.content);
      if (data.videos.length || data.images.length || data.text !== "") {
        if (data.images.length === 1) {
          const embed = new Discord.MessageEmbed()
            .setImage(data.images[0])
            .setDescription(data.text);
          message.channel.send(embed);
        } else {
          const embed = new Discord.MessageEmbed().setDescription(data.text);
          if(data.length) {
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
