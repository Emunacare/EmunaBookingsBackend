const moment = require('moment');
const { STATUS, ACTIVECD, INACTIVECD } = require('../../global-constant.js');

module.exports = async function searchPrescription(fastify, opts) {

    fastify.get('/search', async (request, reply) => {
        const { query } = request;
        const apiName = 'searchPrescription'

        try {
            let getUserQuery = fastify.appdb('precription_details as j')
                .innerJoin('appointments as a', 'a.appointment_id', 'j.appointment_id')
                .innerJoin('users as u', 'u.user_id', 'j.user_id')
                .innerJoin('users as u1', 'u1.user_id', 'j.consultant_id')

            if (query.userId) {
                getUserQuery = getUserQuery.where({ 'j.user_id': query.userId });;
            }
            if (query.consultantId) {
                getUserQuery = getUserQuery.where({ 'j.consultant_id': query.consultantId });;
            }

            const selectMappings = {
                prescriptionId: "j.prescription_id",
                appointmentId: "j.appointment_id",
                consultantId: "u.user_id",
                consultantFirstName: "u.first_name",
                consultantLastName: "u.last_name",
                clientId: "u1.user_id",
                clientFirstName: "u1.first_name",
                clientLastName: "u1.last_name",
                precriptionDescription: "j.precription_des",
                createdDate: "j.created_date",
                updatedDate: "j.updated_date",
            };

            getUserQuery = getUserQuery.select(selectMappings);
            const UserResult = await fastify.lib.selectMultiRow(request, reply, getUserQuery);

            fastify.log.info(`${apiName}-Search Prescription successfully:`, { query, resultCount: UserResult.length });
            return { ...UserResult, rows: UserResult.rows.sort((a, b) => b.userId - a.userId) };
        } catch (error) {
            fastify.log.error(`${apiName}-Error searching Prescription:`, error);
            throw new Error('Error searching Prescription');
        }
    });

    fastify.get('/search/:id', async (request, reply) => {
        const { params } = request;
        const apiName = 'searchPrescriptionById'
        const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD);

        if (!params.id) {
            reply.code(400);
            return fastify.lib.returnMessage('Prescription ID is missing!', 400);
        }

        try {
            let getUserQuery = fastify.appdb('precription_details as j')
                .innerJoin('appointments as a', 'a.appointment_id', 'j.appointment_id')
                .innerJoin('users as u', 'u.user_id', 'j.user_id')
                .innerJoin('users as u1', 'u1.user_id', 'j.consultant_id')
                .where({ "j.precription_id": params.id })


            const selectMappings = {
                prescriptionId: "j.prescription_id",
                appointmentId: "j.appointment_id",
                consultantId: "u.user_id",
                consultantFirstName: "u.first_name",
                consultantLastName: "u.last_name",
                clientId: "u1.user_id",
                clientFirstName: "u1.first_name",
                clientLastName: "u1.last_name",
                precriptionDescription: "j.precription_des",
                createdDate: "j.created_date",
                updatedDate: "j.updated_date",
            };


            getUserQuery = getUserQuery.select(selectMappings);
            const UserResult = await fastify.lib.selectSingleRow(request, reply, getUserQuery);

            fastify.log.info(`${apiName}-Search Prescription by ID successfully:`, { id: params.id });
            return UserResult;
        } catch (error) {
            fastify.log.error(`${apiName}-Error searching Prescription by ID:`, error);
            throw new Error('Error searching Prescription by ID');
        }
    });


}