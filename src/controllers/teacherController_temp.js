// Controller para professores - versão com funções exportadas individualmente
export const create = (req, res) => {
  res.json({ message: 'create function' });
};

export const getAll = (req, res) => {
  res.json({ message: 'get all function' });
};

export const update = (req, res) => {
  res.json({ message: 'update function' });
};

export const deleteTeacher = (req, res) => {
  res.json({ message: 'delete function' });
};
