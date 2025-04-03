import { getEnvVar } from '../utils/getEnvVar.js';
import {
  getAllContacts,
  getContactById,
  createContact,
  deleteContact,
  updateContact,
} from '../services/contacts.js';

import { saveFileToUploadDir } from '../utils/saveFileToUploadDir.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';
import createHttpError from 'http-errors';

import { parseFilterParams } from '../utils/parseFilterParams.js';
import { parseSortParams } from '../utils/parseSortParams.js';
import { parsePaginationParams } from '../utils/parsePaginationParams.js';

export const getContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query);
  const filter = parseFilterParams(req.query);
  filter.userId = req.user._id;

  const contacts = await getAllContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    filter,
  });

  res.status(200).json({
    status: 200,
    message: 'Successfully found contacts!',
    data: contacts,
  });
};

export const getContactByIdController = async (req, res) => {
  const { contactId: _id } = req.params;
  const userId = req.user._id;

  const contact = await getContactById({ _id, userId });

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }
  res.json({
    status: 200,
    message: `Successfully found contact with id ${_id}!`,
    data: contact,
  });
};

export const createContactController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const photo = req.file;

    let photoUrl;

    if (photo) {
      if (getEnvVar('ENABLE_CLOUDINARY') === 'true') {
        photoUrl = await saveFileToCloudinary(photo);
      } else {
        photoUrl = await saveFileToUploadDir(photo);
      }
    }

    const contact = await createContact({
      userId,
      ...req.body,
      photo: photoUrl,
    });

    res.status(201).json({
      status: 201,
      message: 'Successfully created a contact!',
      data: contact,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteContactController = async (req, res) => {
  const { contactId: _id } = req.params;
  const userId = req.user._id;

  const contact = await deleteContact({ _id, userId });

  if (!contact) {
    throw createHttpError(404, 'Contact not found');
  }
  res.status(204).send();
};

export const upsertContactController = async (req, res) => {
  const { contactId: _id } = req.params;
  const userId = req.user._id;
  const photo = req.file;

  let photoUrl;

  if (photo) {
    if (getEnvVar('ENABLE_CLOUDINARY') === 'true') {
      photoUrl = await saveFileToCloudinary(photo);
    } else {
      photoUrl = await saveFileToUploadDir(photo);
    }
  }

  const { isNew, data } = await updateContact(
    { _id, userId },
    { userId, ...req.body },
    { ...req.body, photo: photoUrl },
    {
      upsert: true,
    },
  );

  if (!data) {
    throw createHttpError(404, 'Contact not found');
  }

  const status = isNew ? 201 : 200;

  res.status(status).json({
    status,
    message: 'Successfully upserted a contact',
    data: data,
  });
};

export const patchContactController = async (req, res, next) => {
  const { contactId: _id } = req.params;
  const userId = req.user._id;
  const photo = req.file;

  let photoUrl;

  if (photo) {
    if (getEnvVar('ENABLE_CLOUDINARY') === 'true') {
      photoUrl = await saveFileToCloudinary(photo);
    } else {
      photoUrl = await saveFileToUploadDir(photo);
    }
  }

  const result = await updateContact(
    { _id, userId },
    { ...req.body, photo: photoUrl },
  );

  if (!result) {
    next(createHttpError(404, 'Contact not found'));
    return;
  }

  res.status(200).json({
    status: 200,
    message: 'Successfully patched a contact',
    data: result.data,
  });
};
