// src/utils/constants.js

export const ROLE_ORDER = {
  'super-admin': 1,
  'admin': 2,
  'operator': 3,
  'anggota': 4,
};

export const ORGANIZATION_LEVEL_ORDER = {
  'pc': 1,
  'mwc': 2,
  'ranting': 3,
  'lembaga': 4,
  'banom': 5,
};

export const ORGANIZATION_LEVEL_DISPLAY = {
  'pc': 'PCNU',
  'mwc': 'MWCNU',
  'ranting': 'RANTING',
  'lembaga': 'LEMBAGA',
  'banom': 'BANOM',
};

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Tidak Aktif' },
];

export const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
};