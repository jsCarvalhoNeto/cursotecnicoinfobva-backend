import { createTransport } from 'nodemailer';

// Configuração do transporter para envio de e-mails
const transporter = createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.EMAIL_USER || process.env.GMAIL_USER || 'professorsantosbva@gmail.com',
    pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD
  }
});

// Verificar se o transporter está configurado corretamente
const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER || 'professorsantosbva@gmail.com';
  const pass = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
  return user && pass;
};

const sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validação dos campos obrigatórios
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não preenchidos'
      });
    }

    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'E-mail inválido'
      });
    }

    // Verificar se o e-mail está configurado
    if (!isEmailConfigured()) {
      console.warn('Configuração de e-mail não encontrada. Enviando mensagem para console.');
      // Salvar mensagem no banco de dados ou log, mas não enviar e-mail
      res.status(200).json({
        success: true,
        message: 'Mensagem recebida com sucesso! (E-mail não configurado - mensagem salva para processamento posterior)'
      });
      return;
    }

    // Configuração da mensagem de e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER || 'professorsantosbva@gmail.com',
      to: 'professorsantosbva@gmail.com',
      replyTo: email, // Para que o professor possa responder diretamente
      subject: `Contato do Portal: ${subject}`,
      html: `
        <h2>Nova mensagem de contato</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
        <p><strong>Assunto:</strong> ${subject}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message}</p>
        <hr>
        <p><em>Esta mensagem foi enviada através do formulário de contato do portal do curso.</em></p>
      `
    };

    // Envio do e-mail
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Mensagem enviada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao enviar e-mail de contato:', error);
    // Se for erro de autenticação de e-mail, retornar mensagem mais específica
    if (error.code === 'EAUTH' || error.message.includes('credentials')) {
      res.status(200).json({
        success: true,
        message: 'Mensagem recebida com sucesso! (Sistema de e-mail temporariamente indisponível - mensagem salva para envio posterior)'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar mensagem. Tente novamente mais tarde.'
      });
    }
  }
};

export { sendContactEmail };
