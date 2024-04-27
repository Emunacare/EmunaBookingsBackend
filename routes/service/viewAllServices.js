module.exports = async function searchServices(fastify, opts) {

    fastify.get('/search', async (request, reply) => {
        const { query } = request;
        const apiName = 'searchService'
        // try {
        let getUserQuery = fastify.appdb('services as s')
            .leftJoin('pictures as p', 'p.picture_id', 's.picture_id');

        if (query.name) {
            let filterName = String(query.name).replace(/\s/g, '');
            getUserQuery = getUserQuery.whereRaw(`CONCAT(s.service_name) LIKE '%${filterName}%'`);
        }
        if (query.id) {
            getUserQuery = getUserQuery.where({ 's.user_id': query.id });;
        }

        const selectMappings = {
            serviceId: "s.service_id",
            serviceName: "s.service_name",
            serviceHours: "s.service_hour",
            servicePayment: "s.service_payment",
            serviceDescription: "s.service_description",
            serviceAvailability: "s.service_availability",
            createdDate: "s.created_date",
            updatedDate: "s.updated_date",
            pictureId: "s.picture_id",
            pictureName: "p.file_name"
        };

        getUserQuery = getUserQuery.select(selectMappings);
        const UserResult = await fastify.lib.selectMultiRow(request, reply, getUserQuery);

        fastify.log.info(`${apiName}-Search Services successfully:`, { query, resultCount: UserResult.length });
        return { ...UserResult, rows: UserResult.rows.sort((a, b) => b.userId - a.userId) };
        // } catch (error) {
        //     fastify.log.error(`${apiName}-Error searching Services:`, error);
        //     throw new Error('Error searching Services');
        // }
    });

    fastify.get('/search/:id', async (request, reply) => {
        const { params } = request;
        const apiName = 'searchServiceByID'
        if (!params.id) {
            reply.code(400);
            return fastify.lib.returnMessage('Service ID is missing!', 400);
        }

        try {
            let getUserQuery = fastify.appdb('services as s')
                .leftJoin('pictures as p', 'p.picture_id', 's.picture_id')
                .where({ 's.service_id': params.id });

            const selectMappings = {
                serviceId: "s.service_id",
                serviceName: "s.service_name",
                serviceHours: "s.service_hour",
                servicePayment: "s.service_payment",
                serviceDescription: "s.service_description",
                serviceAvailability: "s.service_availability",
                pictureId: "s.picture_id",
                pictureName: "p.file_name",
                createdDate: "s.created_date",
                updatedDate: "s.updated_date"
            };


            getUserQuery = getUserQuery.select(selectMappings);
            const UserResult = await fastify.lib.selectSingleRow(request, reply, getUserQuery);

            fastify.log.info(`${apiName}-Search User by ID successfully:`, { id: params.id });
            return UserResult;
        } catch (error) {
            fastify.log.error(`${apiName}-Error searching User by ID:`, error);
            throw new Error('Error searching User by ID');
        }
    });

    fastify.delete('/delete/:id', async (request, reply) => {
        const { params } = request;
        const apiName = 'deleteServiceById';
        if (!params.id) {
            reply.code(400);
            return fastify.lib.returnMessage('Service ID is missing!', 400);
        }
        try {
            const deleteUserQuery = fastify.appdb('services').where({ 'service_id': params.id }).del();
            await deleteUserQuery;

            fastify.log.info(`${apiName}-Service deleted successfully:`, { serviceId: params.id });
            return fastify.lib.returnMessage('Service deleted successfully!', 200);
        } catch (error) {
            fastify.log.error(`${apiName}-Error deleting Service:`, error);
            throw new Error('Error deleting Service');
        }
    });

}