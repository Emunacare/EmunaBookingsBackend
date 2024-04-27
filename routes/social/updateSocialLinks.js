
// const { STATUS, ACTIVECD } = require('../../global-constant.js');

module.exports = async function UpdateSocialMediaLink(fastify, opts) {

    fastify.post('/update', async (request, reply) => {
        const { body, headers } = request;
        const apiName = 'UpdateSocialMediaLink';

        if (!body.userId || !body.socialLinkId) {
            reply.code(400);
            return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
        }


        // try {
        const existingSocialLinks = await fastify.appdb('social_media_links as s')
            .select('*')
            .where('social_link_id', body.socialLinkId)
            .first();

        if (!existingSocialLinks) {
            reply.code(404);
            return fastify.lib.returnMessage('User ID is invalid!', 404);
        }

        await fastify.appdb.transaction(async (trx) => {
            const userChangeFields = {
                social_link_instagram: body.socialLinkInstagram,
                social_link_facebook: body.socailLinkFacebook,
                social_link_twitter: body.socailLinkTwitter,
                social_link_youtube: body.socailLinkYoutube,
                social_link_linkedin: body.socailLinkLinkedin,
                social_link_skybe: body.socailLinkSkybe,
                user_id: body.userId,
            };
            const updateUserData = Object.entries(userChangeFields).reduce((data, [key, value]) => {
                if (String(existingSocialLinks[key]) !== String(value)) {
                    data[key] = value;
                }
                return data;
            }, {});

            if (Object.keys(updateUserData).length > 0) {
                await trx('social_media_links')
                    .where('social_link_id', existingSocialLinks.social_link_id)
                    .update({
                        ...updateUserData,
                        updated_date: new Date(),
                    });
            }

        });

        fastify.log.info(`${apiName}-SocialLink updated successfully:`, { socialLinkId: body.socialLinkId });
        return fastify.lib.returnMessage('SocialLink updated successfully!', 200);
        // } catch (error) {
        //     fastify.log.error(`${apiName}-Error updating SocialLink:`, error);
        //     throw new Error('Error updating SocialLink');
        // }
    });

};
