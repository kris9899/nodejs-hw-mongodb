import {
  getAllContacts,
  getContactById,
  createContact,
  deleteContact,
  updateContact,
} from '../services/contacts.js';
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

export const createContactController = async (req, res) => {
  const userId = req.user._id;

  const contact = await createContact({ userId, ...req.body });

  res.status(201).json({
    status: 201,
    message: 'Successfully created a contact!',
    data: contact,
  });
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

  if (_id) {
    const existingContact = await getContactById({ _id, userId });

    if (!existingContact) {
      throw createHttpError(
        403,
        'You do not have permission to update this contact.',
      );
    }
  }

  const { isNew, data } = await updateContact(
    { _id, userId },
    { userId, ...req.body },
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

export const patchContactController = async (req, res) => {
  const { contactId: _id } = req.params;
  const userId = req.user._id;
  const result = await updateContact({ _id, userId }, req.body);

  if (!result) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(200).json({
    status: 200,
    message: 'Successfully patched a contact',
    data: result.data,
  });
};
