module.exports = async function searcSocialLinks(fastify, opts) {

    fastify.get('/search', async (request, reply) => {
        const { query } = request;
        const apiName = 'searcSocialLinksById'
        if (!query.id) {
            reply.code(400);
            return fastify.lib.returnMessage('WorkingHour ID is missing!', 400);
        }

        // try {
        let getUserQuery = fastify.appdb('social_media_links as s')
            .where({ 's.user_id': query.id });


        const selectMappings = {
            socialLinkId: "s.social_link_id",
            socialLinkInstagram: "s.social_link_instagram",
            socailLinkFacebook: "s.social_link_facebook",
            socailLinkTwitter: "s.social_link_twitter",
            socailLinkLinkedin: "s.social_link_linkedin",
            socailLinkYoutube: "s.social_link_youtube",
            socailLinkSkybe: "s.social_link_skybe",
            userId: "s.user_id",
            createdDate: "s.created_date",
            updatedDate: "s.updated_date",
        };


        getUserQuery = getUserQuery.select(selectMappings);
        const UserResult = await fastify.lib.selectSingleRow(request, reply, getUserQuery);

        fastify.log.info(`${apiName}-Search Working Hour by ID successfully:`, { id: query.id });
        return UserResult;
        // } catch (error) {
        //     fastify.log.error(`${apiName}-Error searching  Working Hour  by ID:`, error);
        //     throw new Error('Error searching  Working Hour by ID');
        // }
    });


}