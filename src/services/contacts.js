import { SORT_ORDER } from '../constants/index.js';
import { ContactsCollection } from '../db/models/contacts.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';

export const getAllContacts = async ({
  page = 1,
  perPage = 10,
  sortOrder = SORT_ORDER[0],
  sortBy = 'name',
  filter = {},
}) => {
  const limit = perPage;
  const skip = (page - 1) * perPage;

  const contactsQuery = ContactsCollection.find();

  if (filter.type) {
    contactsQuery.where('contactType').equals(filter.type);
  }

  if (filter.isFavourite) {
    contactsQuery.where('isFavourite').equals(filter.isFavourite);
  }
  const contactsCount = await ContactsCollection.countDocuments({
    userId: filter.userId,
    ...filter,
  });
  const contacts = await contactsQuery
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder })
    .exec();

  const paginationData = calculatePaginationData(contactsCount, page, perPage);

  return {
    data: contacts,
    ...paginationData,
  };
};

export const getContactById = (filter) => ContactsCollection.findOne(filter);

export const createContact = (payload) => ContactsCollection.create(payload);

export const deleteContact = (filter) =>
  ContactsCollection.findOneAndDelete(filter);

export const updateContact = async (filter, payload, options = {}) => {
  const rawRes = await ContactsCollection.findOneAndUpdate(filter, payload, {
    new: true,
    includeResultMetadata: true,
    ...options,
  });

  if (!rawRes || !rawRes.value) {
    return null;
  }

  return {
    data: rawRes.value,
    isNew: Boolean(rawRes?.lastErrorObject?.upserted),
  };
};
