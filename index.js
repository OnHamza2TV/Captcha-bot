const {Client} = require('discord.js')
const client = new Client();
const config = require('./captcha.json');
const type = require('./captchas/verifycodes.json');
client.on('ready', () => {
    console.log('Bot ON')
})

client.on('message', async (message) => {
    if (message.content.startsWith('/ping')) {
        message.channel.send('Pong !');
    }
    if (message.content.startsWith('/emiter')) {
        let member = message.member;
        client.emit('guildMemberAdd', (member));
    }
})


client.on('guildMemberAdd', async (member) => {
    try {
        //Rajout du rôle Non vérifié
        await member.roles.add(config.role_not_verified_id, "Attente de la vérification!");
        //Vérification des permissions du role
        member.guild.channels.cache.each(async (channel) => {
            //Si le role peut voir le salon, nous lui supprimons cette permission
            if (channel.permissionsFor(member.guild.roles.cache.find(role => role.id === config.role_not_verified_id)).has("VIEW_CHANNEL") && channel.id !== config.channel_id) {
                await channel.overwritePermissions([
                    {
                        id: config.role_not_verified_id,
                        deny: ['VIEW_CHANNEL']
                    }
                ], "Manque de sécurité!");
            }
        })
        //Génération de l'image de captcha
        const item = type[Math.floor(Math.random() * type.length)];
        //Envoie du message de vérification
        const msg = await client.channels.cache.get(config.channel_id).send({
            content: member,
            embed: {
                title: "Vérifiez que vous n'êtes pas un robot!",
                description: "Vous savez 60 secondes pour passer la vérification, sinon vous allez être expulser du serveur!",
                color: 3092790,
                image: {
                    url: `${item.type}`
                }
            }
        })
        //Création du filtre
        const filter = m => {
            //Si c'est bien la personne a verifier
            if (m.author.id === member.id) {
                //Si le message est bon, nous continuons
                if (item.answers.includes(m.content.toLowerCase())) {
                    //Suppression de la réponse
                    m.delete();
                    return true;
                } else {
                    //Suppression de la demande
                    msg.delete();
                    //Suppression de la réponse
                    m.delete();
                    //Envoie de la réponse que c'est faux
                    msg.channel.send({
                        embed: {
                            title: "Vérification échouée!",
                            description: "Vous allez être expulsé du serveur!",
                            color: 3092790
                        }
                    }).then(ms => {
                        //Attente de 5 secondes pour être sûr que la personne a le temps de lire
                        setTimeout(async () => {
                            try {
                                //Expulsion du membre
                                await member.kick("Vérification échouée!");
                                //Suppression de notre réponse
                                await ms.delete();
                            } catch (err) {
                                //En cas d'erreur on informe
                                ms.channel.send(`\`\`\`\n${err.stack || err}\`\`\``)
                            }
                        }, 5000)
                    })
                    return false;
                }
            }
        };
        //Attente de la réponse
        await msg.channel.awaitMessages(filter, {max: 1, time: 12000, errors: ['time']}).then(response => {

            if (response) {
                //Suppression du message
                msg.delete();
                //Envoie de la réponse
                msg.channel.send({
                    embed: {
                        title: "Vérification réussie!",
                        description: "Vous êtes redirigé....",
                        color: 3092790
                    }
                }).then(ms => {
                    //Attente de 5 secondes pour être sûr que la personne a le temps de lire
                    setTimeout(async () => {
                        //Supression du rôle non vérifié
                        await member.roles.remove(config.role_not_verified_id, "Vérification passée!")
                        //Ajout du rôle Vérifié
                        await member.roles.add(config.role_verified_id, "Vérification passée!");
                        //Supression de notre réponse
                        await ms.delete();
                    }, 5000)
                })

            }
        }).catch ((err) => {
            if(err)
                //Si le temps est dépassé on l'expulse
            msg.delete();
           msg.channel.send({
               content: member,
               embed: {
                    title: "Vérification échouée!",
                   description: "Vous allez être expulsé du serveur!",
                   color: 3092790
               }
           }).then(ms => {
               setTimeout(function() {
                   ms.delete();
                   member.kick("Vérification échouée!");
               },5000)
           })
        })
    } catch (err) {
        //En cas d'erreur on informe
        console.log(err.stack || err);
    }

})


// noinspection JSIgnoredPromiseFromCall
client.login('');