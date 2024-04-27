const fs = require('fs');
const util = require('util');
const { pipeline } = require('stream');
const pump = util.promisify(pipeline);
const path = require('path');
// const fastify = require('fastify')();




module.exports = async function uploadImage(fastify, opts) {
    const uploadDirectory ="D:/skylink-existing-workspace/face-recognition-javascript-webcam-faceapi/public/labels/sam/";
    
    fastify.post('/upload', async (request, reply) => {
        const apiName = 'uploadImage'
        const allowedFiles = ["jpg", "jpeg", "png"];
        const { query } = request;

        try {
            const data = await request.file();
            if (!data || !data.file || !data.filename) {
                fastify.log.error(`${apiName} - No file uploaded.`);
                reply.code(400);
                return fastify.lib.returnMessage("No file uploaded.", 400);
            }
            if (!query || !query.uploadBy) {
                fastify.log.error(`${apiName} - One or more mandatory fields are missing!`);
                reply.code(400);
                return fastify.lib.returnMessage("One or more mandatory fields are missing!", 400);
            }
            const fileExtension = data.filename.split('.').pop();
            if (!allowedFiles.includes(fileExtension.toLowerCase())) {
                fastify.log.error(`${apiName} - Please upload only files like png or pdf.`);
                reply.code(400);
                return fastify.lib.returnMessage("Please upload only files like png or pdf.", 400);
            }
            const orginalFilename = Date.now() + '.' + fileExtension;
            await pump(data.file, fs.createWriteStream(uploadDirectory + orginalFilename));
            const size = fs.statSync(`${uploadDirectory}/${orginalFilename}`).size;
            let imageId = await fastify.appdb('pictures').insert({
                file_name: orginalFilename,
                size: size,
                created_by: query.uploadBy,
                created_date: new Date(),
            });

            imageDetails = await fastify.appdb('pictures')
                .select({
                    pictureId: "picture_id",
                    fileName: "file_name",
                    size: "size"
                })
                .where({ picture_id: imageId[0] })
                .first();

            fastify.log.info(`${apiName}-Image uploaded successfully:`, imageDetails);
            return imageDetails;
        } catch (error) {
            fastify.log.error(`${apiName}-Error while uploading image:`, error);
            throw new Error('Error while uploading image');
        }
    });

    // fastify.get('/:image', async (request, reply) => {
    //     const apiName = 'downloadImage'
    //     try {
    //         const { params } = request;
    //         const imagePath = uploadDirectory + params.image;
    //         fastify.log.info(`${apiName}-Getting image:`, imagePath);
    //         return fs.createReadStream(imagePath);
    //     } catch (error) {
    //         fastify.log.error(`${apiName}-Error while getting image:`, error);
    //         throw new Error('Error while getting image');
    //     }
    // });

    fastify.get('/:image', async (request, reply) => {
        const apiName = 'downloadImage';
      try {
        const { params } = request;
        const imagePath = uploadDirectory + params.image;
        if (!fs.existsSync(imagePath)) {
          fastify.log.error(`${apiName}-Image not found:`, imagePath);
          reply.code(404).send('Image not found');
          return;
        }

        const imageData = fs.readFileSync(imagePath);

        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Content-Type', 'image/png');
        reply.header("Access-Control-Allow-Credentials", "true")
        reply.send(imageData);
      }
      catch {
          fastify.log.error(`${apiName}-File Error: Getting Image`, imagePath);
          reply.code(500).send('File Error Getting Image');
      }
        });

};

function getContentType(extname) {
  switch (extname) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'text/javascript';
    case '.css':
      return 'text/css';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}
