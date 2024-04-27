module.exports = async function searchHolidays(fastify, opts) {

    fastify.get('/search', async (request, reply) => {
        const { query } = request;
        const apiName = 'searchHolidays'
        try {
            let getUserQuery = fastify.appdb('holidays as s')
            if (query.name) {
                let filterName = String(query.name).replace(/\s/g, '');
                getUserQuery = getUserQuery.whereRaw(`CONCAT(s.holiday_name) LIKE '%${filterName}%'`);
            }
            if (query.id) {
                getUserQuery = getUserQuery.where({ 's.user_id': query.id });;
            }

            const selectMappings = {
                holidayId: "s.holiday_id",
                holidayName: "s.holiday_name",
                holidayDate: "s.holiday_date",
                holidayDescription: "s.holiday_description",
                holidayAvailability: "s.holiday_availability",
                createdDate: "s.created_date",
                updatedDate: "s.updated_date",
            };

            getUserQuery = getUserQuery.select(selectMappings);
            const UserResult = await fastify.lib.selectMultiRow(request, reply, getUserQuery);

            fastify.log.info(`${apiName}-Search Holidays successfully:`, { query, resultCount: UserResult.length });
            return { ...UserResult, rows: UserResult.rows.sort((a, b) => b.userId - a.userId) };
        } catch (error) {
            fastify.log.error(`${apiName}-Error searching Holidays:`, error);
            throw new Error('Error searching Holidays');
        }
    });

    fastify.get('/search/:id', async (request, reply) => {
        const { params } = request;
        const apiName = 'searchHolidayByID'
        if (!params.id) {
            reply.code(400);
            return fastify.lib.returnMessage('holiday ID is missing!', 400);
        }

        try {
            let getUserQuery = fastify.appdb('holidays as s')
                .where({ 's.holiday_id': params.id });


            const selectMappings = {
                holidayId: "s.holiday_id",
                holidayName: "s.holiday_name",
                holidayDate: "s.holiday_date",
                holidayDescription: "s.holiday_description",
                holidayAvailability: "s.holiday_availability",
                createdDate: "s.created_date",
                updatedDate: "s.updated_date",
            };


            getUserQuery = getUserQuery && getUserQuery.select(selectMappings);
            const UserResult = getUserQuery && await fastify.lib.selectSingleRow(request, reply, getUserQuery);

            fastify.log.info(`${apiName}-Search Holiday by ID successfully:`, { id: params.id });
            return UserResult;
        } catch (error) {
            fastify.log.error(`${apiName}-Error searching Holiday by ID:`, error);
            throw new Error('Error searching Holiday by ID');
        }
    });

    fastify.delete('/delete/:id', async (request, reply) => {
        const { params } = request;
        const apiName = 'deleteHolidayById';
        if (!params.id) {
            reply.code(400);
            return fastify.lib.returnMessage('Holiday ID is missing!', 400);
        }
        try {
            const deleteUserQuery = fastify.appdb('holidays').where({ 'holiday_id': params.id }).del();
            await deleteUserQuery;

            fastify.log.info(`${apiName}-Holiday deleted successfully:`, { id: params.id });
            return { message: 'Holiday deleted successfully' };
        } catch (error) {
            fastify.log.error(`${apiName}-Error deleting holiday:`, error);
            throw new Error('Error deleting holiday');
        }
    });

}