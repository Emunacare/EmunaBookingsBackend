const { ROLE, SUPERADMINCD, ADMINCD } = require('../../global-constant.js');

module.exports = async function getConsutlantUsers(fastify, opts) {

    fastify.get('/consultants', async (request, reply) => {
        const { query } = request;
        const apiName = 'getConsultantUsers';
        const adminId = await fastify.lib.getLookUpId(fastify, ROLE, ADMINCD);
        const superAdminId = await fastify.lib.getLookUpId(fastify, ROLE, SUPERADMINCD);
        console.log(adminId, superAdminId);
        let getUserQuery = fastify.appdb('users as u')
            .innerJoin('lookup_details as ld', 'ld.lookup_dtl_id', 'u.role_id')
            .innerJoin('lookup_details as ld1', 'ld1.lookup_dtl_id', 'u.status_id')
            .leftJoin('pictures as p', 'p.picture_id', 'u.picture_id')
            .whereIn('role_id', [296, 295])
        if (query.name) {
            let filterName = String(query.name).replace(/\s/g, '');
            getUserQuery = getUserQuery.whereRaw(`CONCAT(u.first_name, u.last_name) LIKE '%${filterName}%'`);
        }

        const selectMappings = {
            userId: "u.user_id",
            firstName: "u.first_name",
            lastName: "u.last_name",
            officePhone: "u.office_phone",
            personalPhone: "u.personal_phone",
            personalEmail: "u.personal_email",
            officeEmail: "u.office_email",
            pictureId: "p.picture_id",
            pictureName: "p.file_name",
            pictureLink: "u.picture",
            position: "u.position",
            description: "u.about",
            address: "u.address",
            statusId: 'ld1.lookup_dtl_id',
            status: 'ld1.dtl_desc',
            roleId: "ld.lookup_dtl_id",
            role: "ld.dtl_desc",
            createdDate: "u.created_date",
        }

        getUserQuery = getUserQuery.select(selectMappings);
        const UserResult = await fastify.lib.selectMultiRow(request, reply, getUserQuery);

        fastify.log.info(`${apiName}-Search Users successfully:`, { query, resultCount: UserResult.length });
        return { ...UserResult, rows: UserResult.rows.sort((a, b) => b.userId - a.userId) };
        // } catch (error) {
        //     fastify.log.error(`${apiName}-Error searching users:`, error);
        //     throw new Error('Error searching users');
        // }
    });

    fastify.delete('/delete/:id', async (request, reply) => {
        const { params } = request;
        const apiName = 'deleteUserById';
        if (!params.id) {
            reply.code(400);
            return fastify.lib.returnMessage('User ID is missing!', 400);
        }
        console.log(params.id);
        try {
            const deleteUserQuery = fastify.appdb('users').where({ 'user_id': params.id }).del();
            await deleteUserQuery;

            fastify.log.info(`${apiName}-User deleted successfully:`, { id: params.id });
            return { message: 'User deleted successfully' };
        } catch (error) {
            fastify.log.error(`${apiName}-Error deleting user:`, error);
            throw new Error('Error deleting user');
        }
    });

};