const nodemailer = require("nodemailer");
const googleApis =require("googleapis")

const REDIRECT_URI =`https://developers.google.com/oauthplayground`;
const CLIENT_ID = `22704896483-d6e6h86aefijrb85utjujoks5t2v2cid.apps.googleusercontent.com`;
const CLIENT_SECRET =`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`;
const REFRESH_TOKEN =`1//04OXvc8xEeVAqCgYIARAAGAQSNwF-L9IrxK30hHFfAULi0lTT4z68bwaP9G9QAZiTh2lIaiPEDDN8lFlNuWcaJ8UCvhZ2Twm3r0U`;


const authClient = new googleApis.google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI);

authClient.setCredentials({refresh_token:REFRESH_TOKEN});

async function mailer(recevier, id, key){
   try{
    const ACCESS_TOKEN =await authClient.getAccessToken();
    const transport = nodemailer.createTransport({
        service:"gmail",
        auth:{
            type:"OAUTH2",
            user:"bunkarsubhash200@gmail.com",
            clientId:CLIENT_ID,
            clientSecret:CLIENT_SECRET,
            refreshToken:REFRESH_TOKEN,
            accessToken:ACCESS_TOKEN
        }
    })
    const details ={
        from:"bunkarsubhash200@gmail.com",
        to:recevier,
        subject:"inbox",
        text:"massage text",
        html:`hey you can recover your account by clickink the following link <a href="https://localhost:3000/forgot/${id}/${key}">localhost:3000/forgot/${id}/${key}</a>`
    }
    const result = await transport.sendMail(details);
    return result;

   }
   catch(err){
    return err;
   }
}

module.exports = mailer;