module.exports = async function AddSocialMediaLinks(fastify, opts) {

    fastify.post('/add', async (request, reply) => {
        const { body } = request;
        const apiName = 'AddSocialMediaLinks';

        if (!body.userId) {
            reply.code(400);
            return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
        }

        let social_link;

        try {

            await fastify.appdb.transaction(async (trx) => {
                const socialLinkId = await ('social_media_links')
                    .insert({
                        social_link_instagram: body.socialLinkInstagram,
                        social_link_facebook: body.socailLinkFacebook,
                        social_link_twitter: body.socailLinkTwitter,
                        social_link_youtube: body.socailLinkYoutube,
                        social_link_linkedin: body.socailLinkLinkedin,
                        social_link_skybe: body.socailLinkSkybe,
                        user_id: body.userId,
                        created_date: new Date(),
                    });

                social_link = await trx('social_media_links')
                    .select({ socialLinkId: 'social_link_id' })
                    .where({ social_link_id: body.socialLinkId ? body.socialLinkId : socialLinkId[0] })
                    .first();
            });
        } catch (error) {
            fastify.log.error(`${apiName}-Error executing transaction:`, error);
            throw new Error('Error submitting Social Link');
        }

        fastify.log.info(`${apiName}-Social Link added successfully:`, { user });
        return { ...social_link };
    });

};
