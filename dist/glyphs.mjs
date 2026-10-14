// Bravura 1.204 / SIL OFL 1.1. 五線の線間を1とするSVG輪郭。
// CLEF / SHARP / NOTEHEAD は既存 fuyomi/js/staff.js と同一。

export const CLEF_PATH = [
  'M1.88 -3.772C2.012 -3.772 2.12 -3.664 2.12 -3.444C2.12 -3.168 1.988 -2.912 1.676 -2.6',
  'C1.612 -2.536 1.516 -2.444 1.424 -2.364C1.396 -2.34 1.38 -2.344 1.372 -2.396',
  'C1.356 -2.5 1.348 -2.636 1.348 -2.764C1.348 -3.388 1.636 -3.772 1.88 -3.772Z',
  'M1.72 -0.412C1.712 -0.46 1.716 -0.472 1.764 -0.468C2.088 -0.44 2.356 -0.168 2.356 0.184',
  'C2.356 0.436 2.204 0.64 1.98 0.752C1.932 0.776 1.924 0.776 1.916 0.728Z',
  'M1.444 -1.048C1.456 -0.972 1.456 -0.976 1.384 -0.952C1.032 -0.832 0.804 -0.516 0.804 -0.176',
  'C0.804 0.184 0.992 0.44 1.264 0.532C1.296 0.544 1.344 0.556 1.372 0.556',
  'C1.404 0.556 1.42 0.536 1.42 0.512C1.42 0.484 1.388 0.472 1.36 0.46',
  'C1.192 0.388 1.072 0.216 1.072 0.032C1.072 -0.196 1.228 -0.368 1.472 -0.436',
  'C1.536 -0.452 1.544 -0.448 1.552 -0.404L1.752 0.788C1.76 0.832 1.756 0.832 1.696 0.844',
  'C1.632 0.856 1.552 0.864 1.472 0.864C0.772 0.864 0.32 0.476 0.32 -0.08',
  'C0.32 -0.316 0.36 -0.632 0.692 -1.008C0.932 -1.276 1.116 -1.424 1.304 -1.576',
  'C1.344 -1.608 1.352 -1.604 1.36 -1.56Z',
  'M1.504 -1.66C1.496 -1.708 1.504 -1.712 1.528 -1.736C1.592 -1.796 1.676 -1.88 1.752 -1.964',
  'C2.088 -2.332 2.288 -2.808 2.288 -3.26C2.288 -3.608 2.192 -3.952 2.028 -4.192',
  'C1.968 -4.28 1.864 -4.392 1.82 -4.392C1.764 -4.392 1.64 -4.288 1.56 -4.2',
  'C1.264 -3.872 1.168 -3.372 1.168 -2.956C1.168 -2.724 1.196 -2.464 1.224 -2.3',
  'C1.232 -2.252 1.236 -2.244 1.188 -2.204C0.932 -1.992 0.656 -1.748 0.448 -1.492',
  'C0.172 -1.148 0 -0.776 0 -0.348C0 0.348 0.476 1.008 1.456 1.008',
  'C1.548 1.008 1.652 1 1.732 0.984C1.776 0.976 1.784 0.972 1.792 1.02',
  'C1.84 1.288 1.9 1.636 1.9 1.824C1.9 2.416 1.5 2.488 1.264 2.488',
  'C1.048 2.488 0.944 2.424 0.944 2.372C0.944 2.344 0.98 2.332 1.072 2.304',
  'C1.196 2.268 1.34 2.16 1.34 1.928C1.34 1.708 1.2 1.52 0.956 1.52',
  'C0.688 1.52 0.528 1.732 0.528 1.98C0.528 2.24 0.684 2.632 1.288 2.632',
  'C1.556 2.632 2.076 2.512 2.076 1.832C2.076 1.604 2.004 1.224 1.96 0.976',
  'C1.952 0.928 1.956 0.932 2.012 0.908C2.416 0.748 2.684 0.408 2.684 -0.044',
  'C2.684 -0.556 2.308 -1.008 1.72 -1.008C1.616 -1.008 1.616 -1.008 1.604 -1.08Z',
].join('');

export const SHARP_PATH = [
  'M0.672 0.18C0.648 0.26 0.46 0.34 0.368 0.34C0.344 0.34 0.324 0.332 0.32 0.32',
  'C0.312 0.304 0.308 0.216 0.308 0.12C0.308 -0.004 0.312 -0.144 0.32 -0.176',
  'C0.328 -0.244 0.512 -0.328 0.612 -0.328C0.64 -0.328 0.664 -0.32 0.672 -0.304',
  'C0.68 -0.284 0.688 -0.184 0.688 -0.076C0.688 0.032 0.68 0.144 0.672 0.18Z',
  'M0.948 -0.472C0.976 -0.484 0.996 -0.516 0.996 -0.54V-0.824C0.996 -0.844 0.984 -0.856 0.968 -0.856',
  'C0.96 -0.856 0.956 -0.856 0.948 -0.852C0.948 -0.852 0.868 -0.82 0.848 -0.816',
  'C0.82 -0.816 0.792 -0.836 0.792 -0.868V-1.356C0.792 -1.38 0.768 -1.4 0.736 -1.4',
  'C0.696 -1.4 0.672 -1.38 0.672 -1.356V-0.836C0.668 -0.796 0.656 -0.744 0.62 -0.72',
  'C0.572 -0.692 0.436 -0.636 0.368 -0.62C0.332 -0.62 0.32 -0.668 0.32 -0.7V-1.18',
  'C0.32 -1.204 0.292 -1.224 0.264 -1.224C0.224 -1.224 0.2 -1.204 0.2 -1.18V-0.64',
  'C0.2 -0.584 0.176 -0.544 0.152 -0.532C0.128 -0.52 0.048 -0.488 0.048 -0.488',
  'C0.02 -0.48 0 -0.448 0 -0.424V-0.14C0 -0.116 0.012 -0.104 0.032 -0.104',
  'C0.036 -0.104 0.044 -0.108 0.048 -0.108C0.048 -0.108 0.108 -0.132 0.136 -0.148',
  'C0.14 -0.148 0.144 -0.152 0.148 -0.152C0.176 -0.152 0.2 -0.112 0.2 -0.08V0.316',
  'C0.2 0.36 0.18 0.396 0.156 0.408C0.132 0.416 0.048 0.452 0.048 0.452',
  'C0.02 0.46 0 0.492 0 0.516V0.8C0 0.824 0.012 0.836 0.032 0.836',
  'C0.036 0.836 0.044 0.832 0.048 0.832C0.048 0.832 0.104 0.808 0.14 0.796',
  'C0.144 0.792 0.148 0.792 0.152 0.792C0.18 0.792 0.2 0.836 0.2 0.856V1.348',
  'C0.2 1.372 0.224 1.392 0.252 1.392C0.292 1.392 0.32 1.372 0.32 1.348V0.792',
  'C0.32 0.74 0.34 0.712 0.36 0.704L0.604 0.604C0.608 0.604 0.616 0.6 0.62 0.6',
  'C0.652 0.6 0.672 0.648 0.672 0.672V1.172C0.672 1.196 0.696 1.216 0.724 1.216',
  'C0.768 1.216 0.792 1.196 0.792 1.172V0.604C0.792 0.572 0.808 0.524 0.836 0.512',
  'C0.864 0.5 0.948 0.468 0.948 0.468C0.976 0.456 0.996 0.424 0.996 0.4V0.116',
  'C0.996 0.096 0.984 0.084 0.968 0.084C0.96 0.084 0.956 0.084 0.948 0.088L0.844 0.128',
  'C0.82 0.128 0.792 0.104 0.792 0.056V-0.316C0.792 -0.344 0.812 -0.42 0.844 -0.432Z',
].join('');

export const NOTEHEAD_PATH = 'M0.388 0.5C0.744 0.5 1.18 0.172 1.18 -0.168C1.18 -0.372 1.02 -0.5 0.792 -0.5C0.352 -0.5 0 -0.176 0 0.168C0 0.376 0.172 0.5 0.388 0.5Z';

export const WHOLE_PATH = "M0.864 -0.5C0.332 -0.5 0 -0.28 0 -0.008C0 0.26 0.228 0.5 0.824 0.5C1.48 0.5 1.688 0.272 1.688 -0.008C1.688 -0.292 1.236 -0.5 0.864 -0.5ZM0.444 -0.252C0.488 -0.392 0.636 -0.412 0.76 -0.412C1.036 -0.412 1.256 -0.116 1.256 0.124C1.256 0.152 1.252 0.176 1.248 0.2C1.228 0.3 1.172 0.368 1.072 0.392C1.032 0.404 0.988 0.408 0.948 0.408C0.912 0.408 0.88 0.404 0.844 0.392C0.776 0.372 0.712 0.336 0.656 0.288C0.624 0.26 0.596 0.232 0.572 0.2C0.492 0.108 0.432 -0.028 0.432 -0.156C0.432 -0.188 0.436 -0.22 0.444 -0.252Z";

export const HALF_PATH = "M0.388 0.5C1.048 0.5 1.18 -0.036 1.18 -0.168C1.18 -0.372 1.016 -0.5 0.784 -0.5C0.188 -0.5 0 -0.04 0 0.168C0 0.38 0.168 0.5 0.388 0.5ZM0.692 0.184C0.512 0.304 0.388 0.348 0.3 0.348C0.216 0.348 0.168 0.304 0.14 0.256C0.128 0.232 0.116 0.204 0.116 0.176C0.116 0.088 0.204 -0.02 0.48 -0.18C0.68 -0.296 0.804 -0.336 0.884 -0.336C0.96 -0.336 1.004 -0.3 1.032 -0.252C1.044 -0.228 1.056 -0.204 1.056 -0.176C1.056 -0.096 0.972 0 0.692 0.184Z";

export const FLAG_UP_PATH = "M0.952 3.16C0.952 3.16 1.056 2.78 1.056 2.468C1.056 1.968 0.848 1.496 0.596 1.096C0.392 0.78 0.224 0.436 0.16 0.052C0.148 -0.012 0.116 -0.036 0.04 -0.036C0.016 -0.036 0 -0.024 0 0.024V0.98C0.264 1.028 0.644 1.572 0.788 1.912C0.848 2.048 0.884 2.276 0.884 2.512C0.884 2.692 0.856 2.88 0.788 3.06C0.78 3.084 0.776 3.104 0.776 3.12C0.776 3.184 0.816 3.22 0.84 3.236C0.864 3.252 0.932 3.228 0.952 3.16Z";

export const FLAG_DOWN_PATH = "M0.96 -3.04C1.016 -2.872 1.044 -2.672 1.044 -2.492C1.044 -2.256 0.944 -1.92 0.884 -1.784C0.736 -1.448 0.536 -1.124 0 -0.944V-0.004C0 0.044 0.02 0.056 0.044 0.056C0.12 0.056 0.152 0.032 0.16 -0.032C0.228 -0.412 0.524 -0.76 0.728 -1.076C0.98 -1.472 1.224 -1.948 1.224 -2.448C1.224 -2.76 1.144 -3.044 1.112 -3.172C1.08 -3.3 0.9 -3.212 0.96 -3.04Z";

export const REST_WHOLE_PATH = "M1.128 0.436V0.068C1.128 0.008 1.08 -0.036 1.024 -0.036H0.104C0.044 -0.036 0 0.008 0 0.068V0.436C0 0.492 0.044 0.54 0.104 0.54H1.024C1.08 0.54 1.128 0.492 1.128 0.436Z";

export const REST_HALF_PATH = "M1.128 -0.096V-0.464C1.128 -0.524 1.08 -0.568 1.024 -0.568H0.104C0.044 -0.568 0 -0.524 0 -0.464V-0.096C0 -0.04 0.044 0.008 0.104 0.008H1.024C1.08 0.008 1.128 -0.04 1.128 -0.096Z";

export const REST_QUARTER_PATH = "M0.312 0.152C0.376 0.232 0.432 0.308 0.484 0.392C0.492 0.408 0.508 0.44 0.508 0.448C0.508 0.452 0.508 0.46 0.504 0.464C0.496 0.48 0.48 0.484 0.46 0.484C0.444 0.484 0.412 0.476 0.396 0.472C0.376 0.472 0.352 0.46 0.332 0.46C0.16 0.46 0.004 0.632 0.004 0.844C0.004 1.044 0.176 1.24 0.468 1.464C0.5 1.488 0.54 1.5 0.572 1.5C0.6 1.5 0.628 1.492 0.632 1.476C0.636 1.464 0.64 1.456 0.64 1.448C0.64 1.412 0.608 1.38 0.576 1.352C0.524 1.352 0.48 1.244 0.472 1.208C0.46 1.176 0.456 1.14 0.456 1.104C0.456 0.98 0.516 0.84 0.644 0.816C0.664 0.812 0.684 0.812 0.708 0.812C0.824 0.812 0.956 0.856 1.02 0.88C1.024 0.88 1.028 0.884 1.032 0.884C1.044 0.888 1.052 0.888 1.06 0.888C1.072 0.888 1.08 0.884 1.08 0.872C1.08 0.824 0.976 0.692 0.932 0.644C0.78 0.46 0.656 0.312 0.656 0.088C0.656 0.072 0.66 0.052 0.66 0.036C0.676 -0.196 0.82 -0.388 0.924 -0.552C0.936 -0.572 0.94 -0.592 0.94 -0.612C0.94 -0.652 0.924 -0.688 0.924 -0.688C0.924 -0.688 0.332 -1.392 0.264 -1.46C0.244 -1.48 0.216 -1.492 0.192 -1.492C0.152 -1.492 0.112 -1.464 0.112 -1.408C0.112 -1.388 0.116 -1.368 0.128 -1.344C0.144 -1.3 0.372 -1.096 0.372 -0.808C0.372 -0.66 0.312 -0.488 0.132 -0.3C0.092 -0.26 0.076 -0.216 0.076 -0.184C0.076 -0.128 0.116 -0.088 0.116 -0.088Z";

export const REST_EIGHTH_PATH = "M0.536 -0.428C0.536 -0.576 0.416 -0.696 0.268 -0.696C0.12 -0.696 0 -0.576 0 -0.428C0 -0.344 0.048 -0.272 0.108 -0.224C0.144 -0.2 0.18 -0.18 0.22 -0.172C0.252 -0.164 0.288 -0.156 0.324 -0.156C0.38 -0.156 0.436 -0.168 0.48 -0.184C0.536 -0.2 0.572 -0.216 0.624 -0.244C0.632 -0.248 0.64 -0.248 0.644 -0.248C0.66 -0.248 0.664 -0.232 0.664 -0.212C0.664 -0.2 0.664 -0.184 0.66 -0.168C0.648 -0.108 0.36 0.688 0.288 0.952C0.288 1 0.38 1.004 0.404 1.004C0.448 1.004 0.504 0.996 0.544 0.964C0.556 0.956 0.948 -0.448 0.948 -0.448C0.964 -0.52 0.984 -0.584 0.988 -0.604C0.988 -0.644 0.948 -0.664 0.94 -0.668C0.932 -0.668 0.92 -0.668 0.896 -0.652C0.868 -0.628 0.668 -0.388 0.536 -0.388Z";

export const BRAVURA_LICENSE = "Copyright \u00a9 2015, Steinberg Media Technologies GmbH (http://www.steinberg.net/),\nwith Reserved Font Name \"Bravura\".\n\nThis Font Software is licensed under the SIL Open Font License, Version 1.1.\nThis license is copied below, and is also available with a FAQ at:\nhttp://scripts.sil.org/OFL\n\n\n-----------------------------------------------------------\nSIL OPEN FONT LICENSE Version 1.1 - 26 February 2007\n-----------------------------------------------------------\n\nPREAMBLE\nThe goals of the Open Font License (OFL) are to stimulate worldwide\ndevelopment of collaborative font projects, to support the font creation\nefforts of academic and linguistic communities, and to provide a free and\nopen framework in which fonts may be shared and improved in partnership\nwith others.\n\nThe OFL allows the licensed fonts to be used, studied, modified and\nredistributed freely as long as they are not sold by themselves. The\nfonts, including any derivative works, can be bundled, embedded, \nredistributed and/or sold with any software provided that any reserved\nnames are not used by derivative works. The fonts and derivatives,\nhowever, cannot be released under any other type of license. The\nrequirement for fonts to remain under this license does not apply\nto any document created using the fonts or their derivatives.\n\nDEFINITIONS\n\"Font Software\" refers to the set of files released by the Copyright\nHolder(s) under this license and clearly marked as such. This may\ninclude source files, build scripts and documentation.\n\n\"Reserved Font Name\" refers to any names specified as such after the\ncopyright statement(s).\n\n\"Original Version\" refers to the collection of Font Software components as\ndistributed by the Copyright Holder(s).\n\n\"Modified Version\" refers to any derivative made by adding to, deleting,\nor substituting -- in part or in whole -- any of the components of the\nOriginal Version, by changing formats or by porting the Font Software to a\nnew environment.\n\n\"Author\" refers to any designer, engineer, programmer, technical\nwriter or other person who contributed to the Font Software.\n\nPERMISSION & CONDITIONS\nPermission is hereby granted, free of charge, to any person obtaining\na copy of the Font Software, to use, study, copy, merge, embed, modify,\nredistribute, and sell modified and unmodified copies of the Font\nSoftware, subject to the following conditions:\n\n1) Neither the Font Software nor any of its individual components,\nin Original or Modified Versions, may be sold by itself.\n\n2) Original or Modified Versions of the Font Software may be bundled,\nredistributed and/or sold with any software, provided that each copy\ncontains the above copyright notice and this license. These can be\nincluded either as stand-alone text files, human-readable headers or\nin the appropriate machine-readable metadata fields within text or\nbinary files as long as those fields can be easily viewed by the user.\n\n3) No Modified Version of the Font Software may use the Reserved Font\nName(s) unless explicit written permission is granted by the corresponding\nCopyright Holder. This restriction only applies to the primary font name as\npresented to the users.\n\n4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font\nSoftware shall not be used to promote, endorse or advertise any\nModified Version, except to acknowledge the contribution(s) of the\nCopyright Holder(s) and the Author(s) or with their explicit written\npermission.\n\n5) The Font Software, modified or unmodified, in part or in whole,\nmust be distributed entirely under this license, and must not be\ndistributed under any other license. The requirement for fonts to\nremain under this license does not apply to any document created\nusing the Font Software.\n\nTERMINATION\nThis license becomes null and void if any of the above conditions are\nnot met.\n\nDISCLAIMER\nTHE FONT SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND,\nEXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF\nMERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT\nOF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE\nCOPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,\nINCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL\nDAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\nFROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM\nOTHER DEALINGS IN THE FONT SOFTWARE.\n";

export const FLAT_PATH = 'M0.048 0.68C0.06 0.6960000000000001 0.07200000000000001 0.7000000000000001 0.084 0.7000000000000001C0.096 0.7000000000000001 0.108 0.6920000000000001 0.108 0.6920000000000001C0.228 0.624 0.324 0.516 0.424 0.448C0.78 0.2 0.904 -0.044 0.904 -0.228C0.904 -0.456 0.728 -0.6 0.544 -0.612C0.516 -0.612 0.488 -0.608 0.46 -0.6C0.41600000000000004 -0.588 0.368 -0.5720000000000001 0.324 -0.544C0.3 -0.524 0.256 -0.488 0.23600000000000002 -0.488C0.228 -0.488 0.224 -0.488 0.216 -0.492C0.188 -0.504 0.17200000000000001 -0.532 0.17200000000000001 -0.56C0.176 -0.648 0.2 -1.608 0.2 -1.688C0.2 -1.732 0.164 -1.756 0.124 -1.756C0.068 -1.756 0.004 -1.716 0.0 -1.6440000000000001C0.0 -1.6440000000000001 0.016 0.64 0.048 0.68ZM0.188 0.324C0.188 0.324 0.176 0.084 0.176 -0.076C0.176 -0.14 0.18 -0.188 0.184 -0.20400000000000001C0.2 -0.252 0.304 -0.34 0.36 -0.372C0.396 -0.392 0.432 -0.4 0.464 -0.4C0.504 -0.4 0.54 -0.384 0.5640000000000001 -0.356C0.604 -0.312 0.628 -0.244 0.628 -0.168C0.628 -0.096 0.608 -0.012 0.56 0.07200000000000001C0.508 0.168 0.392 0.296 0.272 0.372C0.256 0.38 0.244 0.384 0.232 0.384C0.196 0.384 0.188 0.34400000000000003 0.188 0.324Z';

export const NATURAL_PATH = [
  'M0.148 -0.156C0.148 -0.212 0.392 -0.316 0.488 -0.316C0.512 -0.316 0.524 -0.312 0.524 -0.296',
  'V0.116C0.524 0.188 0.296 0.28 0.196 0.28C0.168 0.28 0.148 0.272 0.148 0.256Z',
  'M0.564 -0.724C0.556 -0.724 0.552 -0.72 0.548 -0.72C0.548 -0.72 0.292 -0.628 0.188 -0.628',
  'C0.164 -0.628 0.148 -0.632 0.148 -0.648V-1.316C0.148 -1.344 0.124 -1.364 0.1 -1.364H0.048',
  'C0.02 -1.364 0 -1.344 0 -1.316V0.744C0 0.768 0.012 0.78 0.032 0.78',
  'C0.036 0.78 0.044 0.776 0.048 0.776C0.048 0.776 0.056 0.776 0.06 0.772',
  'C0.116 0.748 0.34 0.652 0.456 0.652C0.496 0.652 0.524 0.664 0.524 0.696V1.292',
  'C0.524 1.32 0.544 1.34 0.572 1.34H0.624C0.648 1.34 0.672 1.32 0.672 1.292V-0.716',
  'C0.672 -0.736 0.656 -0.748 0.64 -0.748C0.636 -0.748 0.628 -0.748 0.624 -0.744Z',
].join('');
