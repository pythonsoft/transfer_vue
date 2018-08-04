/**
 * Created by steven on 2018/07/24.
 */
const uuid = require('uuid');
const util = require('util');

class TransferTask {
  constructor(settings) {
    this.settings = Object.assign({
      size: '',
      name: '',
      lastModifiedTime: '',
      userId: '',
      userName: '',
      _id: ''
    }, settings);

    this.status = {
      ready: 1,
      start: 2,
      transfer: 3,
      success: 4,
      error: 1000
    };
    this.headerPackage = this._generateHeaderPackage();
    this._initStatus();
  }

  _initStatus() {
    const childTaskStatus = {};
    const order = this.headerPackage.order;
    const statusReady = this.status.ready;
    for (let i = 0, len = order.length; i < len; i++) {
      childTaskStatus[order[i]] = {
        status: statusReady,
        index: i,
        retryTime: 0,
        info: {},
        log: []
      };
    }

    this.childTaskStatus = childTaskStatus;
  }

  _generateHeaderPackage() {
    const size = this.settings.size;
    const headerPackageInfo = {
      _id: this.settings._id,
      name: this.settings.name,
      userId: this.settings.userId,
      userName: this.settings.userName,
      total: size,
      size: size,
      lastModifiedTime: this.settings.lastModifiedTime,
      createdTime: '',
      eachPackageSize: 1024 * 100,
      packageCount: 0,
      order: [] // child task uuid list
    };
    headerPackageInfo.packageCount = ((size / headerPackageInfo.eachPackageSize) | 0) + (size % headerPackageInfo.eachPackageSize === 0 ? 0 : 1);
    for (let i = 0, len = headerPackageInfo.packageCount; i < len; i++) {
      headerPackageInfo.order.push(uuid.v4());
    }

    return headerPackageInfo;
  }

  _getReadPackage() {
    let item = null;
    for (const st in this.childTaskStatus) {
      item = this.childTaskStatus[st];
      if (item.status === this.status.ready) {
        break;
      }
    }

    return item ? this._getPackageAndStreamByIndex(item.index) : null;
  }

  _getErrorPackage() {
    let item = null;
    for (const st in this.childTaskStatus) {
      item = this.childTaskStatus[st];
      if (item.status == this.status.error) {
        break;
      }
    }

    return item ? this._getPackageAndStreamByIndex(item.index) : null;
  }

  _isAllPackagePostSuccess() {
    let isSuccess = true;
    let item = null;

    for (const st in this.childTaskStatus) {
      item = this.childTaskStatus[st];
      if (item.status !== this.status.success) {
        isSuccess = false;
        break;
      }
    }

    return isSuccess;
  }

  _getPackageAndStreamByIndex(index) {
    const headerPackage = this.headerPackage;
    const eachPackageSize = headerPackage.eachPackageSize;
    const readStartPosition = eachPackageSize * index;
    let readEndPosition = readStartPosition + eachPackageSize;
    const maxEndPosition = headerPackage.size;
    let size = headerPackage.eachPackageSize;

    if (readEndPosition > maxEndPosition) {
      readEndPosition = maxEndPosition;
      size = headerPackage.size - eachPackageSize * (headerPackage.packageCount - 1);
    }

    const id = headerPackage.order[index];
    const st = this.childTaskStatus[id];

    const packageInfo = {
      pid: headerPackage._id,
      _id: id,
      index,
      size,
      total: this.settings.size,
      name: this.settings.name,
      start: readStartPosition,
      end: readEndPosition
    };

    if (st.status === this.status.ready) {
      // this._setStartStatus(packageInfo);
    } else if (st.status === this.status.error) {
      this._updateErrorStatusToStart(packageInfo);
    } else {
      return null;
    }
    return { packageInfo };
  }

  _setStartStatus(packageInfo) {
    const id = packageInfo._id;
    const st = Object.assign({}, this.childTaskStatus[id]);
    st.status = this.status.start;
    st.info = packageInfo;
    st.log.push(util.format('[%s] [%s-%s] %s', new Date(), packageInfo.pid, packageInfo._id, 'package start transfer'));

    this.childTaskStatus[id] = st;
  }

  _updateErrorStatusToStart(packageInfo) {
    const id = packageInfo._id;
    const st = Object.assign({}, this.childTaskStatus[id]);

    st.status = this.status.start;
    st.info = packageInfo;
    st.retryTime += 1;
    st.log.push(util.format('[%s] [%s-%s] %s', new Date(), packageInfo.pid, packageInfo._id, 'error package retry to transfer'));

    this.childTaskStatus[id] = st;
  }

  getPackage() {
    if (this._isAllPackagePostSuccess()) {
      return 'done';
    }

    let pkg = this._getReadPackage();

    if (!pkg) {
      pkg = this._getErrorPackage();
    }

    return pkg;
  }

  setSuccessPackage(packageId) {
    const packageStatus = this.childTaskStatus[packageId];
    if (!packageStatus) { return false; }

    const st = Object.assign({}, packageStatus);

    st.status = this.status.success;
    st.log.push(util.format('[%s] [%s-%s] %s', new Date(), st.pid, st._id, 'package has been accept'));

    this.childTaskStatus[packageId] = st;
  }

  setFailPackage(packageId, err) {
    const packageStatus = this.childTaskStatus[packageId];
    if (!packageStatus) { return false; }

    const st = Object.assign({}, packageStatus);

    st.status = this.status.error;
    st.log.push(util.format('[%s] [%s-%s] %s', new Date(), st.pid, st._id, `package send error : ${err}`));

    this.childTaskStatus[packageId] = st;
  }
}

module.exports = TransferTask;
