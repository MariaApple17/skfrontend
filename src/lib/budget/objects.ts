import {
  CLASSIFICATIONS,
  getClassificationById,
} from './classifications';

export interface ObjectOfExpenditure {
  id: number;
  code: string;
  name: string;
  // Fixed: optional because the API can return descriptions even if the
  // hardcoded reference list omits them.
  description?: string;
  classificationId: number;
}

const CLASSIFICATION_IDS = new Set(
  CLASSIFICATIONS.map((classification) => classification.id)
);

export const OBJECTS_OF_EXPENDITURE: ObjectOfExpenditure[] = [
  // Fixed: every object now uses a valid classificationId from CLASSIFICATIONS.
  // Make sure classificationId references a real classification id.
  // This keeps lookup by object and classification relationship consistent.
  // PERSONNEL SERVICES
  {
    id: 1,
    code: '50101010',
    name: 'Honorarium',
    classificationId: 1,
  },
  {
    id: 2,
    code: '50102010',
    name: 'Personnel Economic Relief Allowance',
    classificationId: 1,
  },
  {
    id: 3,
    code: '50103010',
    name: 'Representation Allowance',
    classificationId: 1,
  },
  {
    id: 4,
    code: '50104010',
    name: 'Transportation Allowance',
    classificationId: 1,
  },

  // MOOE
  {
    id: 5,
    code: '50201010',
    name: 'Traveling Expenses - Local',
    classificationId: 2,
  },
  {
    id: 6,
    code: '50202010',
    name: 'Training Expenses',
    classificationId: 2,
  },
  {
    id: 7,
    code: '50203010',
    name: 'Office Supplies Expenses',
    classificationId: 2,
  },
  {
    id: 8,
    code: '50204010',
    name: 'Water Expenses',
    classificationId: 2,
  },
  {
    id: 9,
    code: '50204020',
    name: 'Electricity Expenses',
    classificationId: 2,
  },
  {
    id: 10,
    code: '50205040',
    name: 'Internet Subscription Expenses',
    classificationId: 2,
  },
  {
    id: 11,
    code: '50211030',
    name: 'Consultancy Services',
    classificationId: 2,
  },
  {
    id: 12,
    code: '50212010',
    name: 'Janitorial Services',
    classificationId: 2,
  },
  {
    id: 13,
    code: '50213020',
    name: 'Repairs and Maintenance - Buildings',
    classificationId: 2,
  },

  // CAPITAL OUTLAY
  {
    id: 14,
    code: '10604010',
    name: 'ICT Equipment',
    classificationId: 3,
  },
  {
    id: 15,
    code: '10604020',
    name: 'Office Equipment',
    classificationId: 3,
  },
  {
    id: 16,
    code: '10604030',
    name: 'Furniture and Fixtures',
    classificationId: 3,
  },
  {
    id: 17,
    code: '10604040',
    name: 'Transportation Equipment',
    classificationId: 3,
  },
];

export const getObjectsOfExpenditureByClassificationId = (
  classificationId?: number | string | null
) => {
  const normalizedClassificationId = Number(classificationId);

  if (
    !Number.isInteger(normalizedClassificationId) ||
    normalizedClassificationId <= 0 ||
    !CLASSIFICATION_IDS.has(normalizedClassificationId)
  ) {
    return [];
  }

  return OBJECTS_OF_EXPENDITURE.filter(
    (item) => item.classificationId === normalizedClassificationId
  );
};

// Fixed: helper export for screens that need a single object lookup.
export const getObjectOfExpenditureById = (
  objectId?: number | string | null
) => {
  const rawValue = String(objectId ?? '').trim()
  console.log('[budget.objects] getObjectOfExpenditureById called with', {
    objectId,
    rawValue,
  })

  if (!rawValue) {
    console.warn('[budget.objects] no object id or code provided')
    return undefined
  }

  const availableIds = OBJECTS_OF_EXPENDITURE.map((item) => item.id)
  const availableCodes = OBJECTS_OF_EXPENDITURE.map((item) => item.code)

  console.log('[budget.objects] available object ids', availableIds)
  console.log('[budget.objects] available object codes', availableCodes)

  const numericId = Number(rawValue)
  let foundObject = undefined

  if (Number.isInteger(numericId) && numericId > 0) {
    foundObject = OBJECTS_OF_EXPENDITURE.find(
      (item) => item.id === numericId
    )
    console.log('[budget.objects] lookup by numeric id', numericId, { foundObject })
  }

  if (!foundObject) {
    foundObject = OBJECTS_OF_EXPENDITURE.find(
      (item) => item.code === rawValue
    )
    console.log('[budget.objects] lookup by code', rawValue, { foundObject })
  }

  if (!foundObject) {
    console.warn('[budget.objects] object of expenditure not found', {
      rawValue,
    })
  }

  return foundObject
}

// Fixed: helper export for screens that need both the object and its parent classification.
export const getObjectOfExpenditureWithClassification = (
  objectId?: number | string | null
) => {
  const object = getObjectOfExpenditureById(objectId)

  if (!object) {
    return undefined
  }

  const classification = getClassificationById(object.classificationId)
  if (!classification) {
    console.warn('[budget.objects] classification not found for object', {
      objectId: object.id,
      classificationId: object.classificationId,
    })
  }

  return {
    ...object,
    classification,
  }
};
