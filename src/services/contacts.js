import { SORT_ORDER } from '../constants/index.js';
import { ContactsCollection } from '../db/models/contacts.js';
import { calculatePaginationData } from '../utils/calculatePaginationData.js';

export const getAllContacts = async ({
  page = 1,
  perPage = 10,
  sortOrder = SORT_ORDER.ASC,
  sortBy = 'name',
  filter = {},
}) => {
  const skip = (page - 1) * perPage;

  const contactsQuery = ContactsCollection.find(filter);

  if (filter.type) {
    contactsQuery.where('contactType').equals(filter.type);
  }

  if (filter.isFavourite) {
    contactsQuery.where('isFavourite').equals(filter.isFavourite);
  }
  if (filter.name) {
    contactsQuery.where('name').regex(new RegExp(filter.name, 'i'));
  }
  if (filter.userId) {
    contactsQuery.where('userId').equals(filter.userId);
  }

  const contactsCount = await contactsQuery.clone().countDocuments();

  const contacts = await contactsQuery
    .skip(skip)
    .limit(perPage)
    .sort({ [sortBy]: sortOrder })
    .exec();

  const paginationData = calculatePaginationData(contactsCount, perPage, page);

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
