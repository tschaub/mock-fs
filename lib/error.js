'use strict';

/**
 * Error codes from libuv.
 * @enum {number}
 */
var codes = {
  UNKNOWN: {
    errno: -4094,
    message: 'unknown error'
  },
  OK: {
    errno: 0,
    message: 'success'
  },
  EOF: {
    errno: -4095,
    message: 'end of file'
  },

  E2BIG: {
    errno: -7,
    message: 'argument list too long'
  },
  EACCES: {
    errno: -13,
    message: 'permission denied'
  },
  EADDRINUSE: {
    errno: -48,
    message: 'address already in use'
  },
  EADDRNOTAVAIL: {
    errno: -49,
    message: 'address not available'
  },
  EAFNOSUPPORT: {
    errno: -47,
    message: 'address family not supported'
  },
  EAGAIN: {
    errno: -35,
    message: 'resource temporarily unavailable'
  },
  EAI_ADDRFAMILY: {
    errno: -3000,
    message: 'address family not supported'
  },
  EAI_AGAIN: {
    errno: -3001,
    message: 'temporary failure'
  },
  EAI_BADFLAGS: {
    errno: -3002,
    message: 'bad ai_flags value'
  },
  EAI_BADHINTS: {
    errno: -3013,
    message: 'invalid value for hints'
  },
  EAI_CANCELED: {
    errno: -3003,
    message: 'request canceled'
  },
  EAI_FAIL: {
    errno: -3004,
    message: 'permanent failure'
  },
  EAI_FAMILY: {
    errno: -3005,
    message: 'ai_family not supported'
  },
  EAI_MEMORY: {
    errno: -3006,
    message: 'out of memory'
  },
  EAI_NODATA: {
    errno: -3007,
    message: 'no address'
  },
  EAI_NONAME: {
    errno: -3008,
    message: 'unknown node or service'
  },
  EAI_OVERFLOW: {
    errno: -3009,
    message: 'argument buffer overflow'
  },
  EAI_PROTOCOL: {
    errno: -3014,
    message: 'resolved protocol is unknown'
  },
  EAI_SERVICE: {
    errno: -3010,
    message: 'service not available for socket type'
  },
  EAI_SOCKTYPE: {
    errno: -3011,
    message: 'socket type not supported'
  },
  EALREADY: {
    errno: -37,
    message: 'connection already in progress'
  },
  EBADF: {
    errno: -9,
    message: 'bad file descriptor'
  },
  EBUSY: {
    errno: -16,
    message: 'resource busy or locked'
  },
  ECANCELED: {
    errno: -89,
    message: 'operation canceled'
  },
  ECHARSET: {
    errno: -4080,
    message: 'invalid Unicode character'
  },
  ECONNABORTED: {
    errno: -53,
    message: 'software caused connection abort'
  },
  ECONNREFUSED: {
    errno: -61,
    message: 'connection refused'
  },
  ECONNRESET: {
    errno: -54,
    message: 'connection reset by peer'
  },
  EDESTADDRREQ: {
    errno: -39,
    message: 'destination address required'
  },
  EEXIST: {
    errno: -17,
    message: 'file already exists'
  },
  EFAULT: {
    errno: -14,
    message: 'bad address in system call argument'
  },
  EFBIG: {
    errno: -27,
    message: 'file too large'
  },
  EHOSTUNREACH: {
    errno: -65,
    message: 'host is unreachable'
  },
  EINTR: {
    errno: -4,
    message: 'interrupted system call'
  },
  EINVAL: {
    errno: -22,
    message: 'invalid argument'
  },
  EIO: {
    errno: -5,
    message: 'i/o error'
  },
  EISCONN: {
    errno: -56,
    message: 'socket is already connected'
  },
  EISDIR: {
    errno: -21,
    message: 'illegal operation on a directory'
  },
  ELOOP: {
    errno: -62,
    message: 'too many symbolic links encountered'
  },
  EMFILE: {
    errno: -24,
    message: 'too many open files'
  },
  EMSGSIZE: {
    errno: -40,
    message: 'message too long'
  },
  ENAMETOOLONG: {
    errno: -63,
    message: 'name too long'
  },
  ENETDOWN: {
    errno: -50,
    message: 'network is down'
  },
  ENETUNREACH: {
    errno: -51,
    message: 'network is unreachable'
  },
  ENFILE: {
    errno: -23,
    message: 'file table overflow'
  },
  ENOBUFS: {
    errno: -55,
    message: 'no buffer space available'
  },
  ENODEV: {
    errno: -19,
    message: 'no such device'
  },
  ENOENT: {
    errno: -2,
    message: 'no such file or directory'
  },
  ENOMEM: {
    errno: -12,
    message: 'not enough memory'
  },
  ENONET: {
    errno: -4056,
    message: 'machine is not on the network'
  },
  ENOPROTOOPT: {
    errno: -42,
    message: 'protocol not available'
  },
  ENOSPC: {
    errno: -28,
    message: 'no space left on device'
  },
  ENOSYS: {
    errno: -78,
    message: 'function not implemented'
  },
  ENOTCONN: {
    errno: -57,
    message: 'socket is not connected'
  },
  ENOTDIR: {
    errno: -20,
    message: 'not a directory'
  },
  ENOTEMPTY: {
    errno: -66,
    message: 'directory not empty'
  },
  ENOTSOCK: {
    errno: -38,
    message: 'socket operation on non-socket'
  },
  ENOTSUP: {
    errno: -45,
    message: 'operation not supported on socket'
  },
  EPERM: {
    errno: -1,
    message: 'operation not permitted'
  },
  EPIPE: {
    errno: -32,
    message: 'broken pipe'
  },
  EPROTO: {
    errno: -100,
    message: 'protocol error'
  },
  EPROTONOSUPPORT: {
    errno: -43,
    message: 'protocol not supported'
  },
  EPROTOTYPE: {
    errno: -41,
    message: 'protocol wrong type for socket'
  },
  ERANGE: {
    errno: -34,
    message: 'result too large'
  },
  EROFS: {
    errno: -30,
    message: 'read-only file system'
  },
  ESHUTDOWN: {
    errno: -58,
    message: 'cannot send after transport endpoint shutdown'
  },
  ESPIPE: {
    errno: -29,
    message: 'invalid seek'
  },
  ESRCH: {
    errno: -3,
    message: 'no such process'
  },
  ETIMEDOUT: {
    errno: -60,
    message: 'connection timed out'
  },
  ETXTBSY: {
    errno: -26,
    message: 'text file is busy'
  },
  EXDEV: {
    errno: -18,
    message: 'cross-device link not permitted'
  },
  ENXIO: {
    errno: -6,
    message: 'no such device or address'
  },
  EMLINK: {
    errno: -31,
    message: 'too many links'
  },
  EHOSTDOWN: {
    errno: -64,
    message: 'host is down'
  },
  EREMOTEIO: {
    errno: -4030,
    message: 'remote I/O error'
  },
  ENOTTY: {
    errno: -25,
    message: 'inappropriate ioctl for device'
  },
  EFTYPE: {
    errno: -79,
    message: 'inappropriate file type or format'
  }
};

/**
 * Create an error.
 * @param {string} code Error code.
 * @param {string} path Path (optional).
 * @constructor
 */
function FSError(code, path) {
  if (!codes.hasOwnProperty(code)) {
    throw new Error('Programmer error, invalid error code: ' + code);
  }
  Error.call(this);
  var details = codes[code];
  var message = code + ', ' + details.message;
  if (path) {
    message += " '" + path + "'";
  }
  this.message = message;
  this.code = code;
  this.errno = details.errno;
  if (path !== undefined) {
    this.path = path;
  }
  Error.captureStackTrace(this, FSError);
}
FSError.prototype = new Error();

/**
 * Error constructor.
 */
exports = module.exports = FSError;
