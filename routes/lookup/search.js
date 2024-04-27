module.exports = async function lookupSearch(fastify, opts) {
    fastify.get('/search', async (request, reply) => {
        const { query } = request;
        const apiName = 'lookupAPI'
        if (!query.key) {
            reply.code(400);
            return fastify.lib.returnMessage('Key is missing!', 400);
        }

        try {
            let sqlQuery = fastify.appdb('lookup_details as ld ')
                .innerJoin('lookup_group as lg ', 'lg.lookup_group_id', 'ld.lookup_group_id')
                .where({ 'lg.lookup_group_cd': query.key });

            const selectMappings = {
                id: "ld.lookup_dtl_id",
                code: "ld.dtl_cd",
                description: "ld.dtl_desc",
                seq: "ld.sequence_no"
            }
            sqlQuery = sqlQuery.select(selectMappings).orderBy('ld.sequence_no', 'asc');
            console.log(sqlQuery);
            const result = await fastify.lib.selectMultiRow(request, reply, sqlQuery);

            if (result && result.rows) {
                fastify.log.info(`${apiName}-Lookup search for key "${query.key}" successful. Found ${result.rows.length} records.`);
            } else {
                fastify.log.warn(`${apiName}-Lookup search for key "${query.key}" returned no records.`);
            }

            return result;
        } catch (error) {
            fastify.log.error(`${apiName}-Error executing lookup search:`, error);
            throw new Error('Error while searching for lookup data');
        }
    });
};
