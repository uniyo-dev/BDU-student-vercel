// Data Store Module
const Store = {
  save(key, data) {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch(e) {
      console.error('Save error:', e);
    }
  },

  get(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key));
    } catch(e) {
      return null;
    }
  },

  remove(key) {
    sessionStorage.removeItem(key);
  },

  clear() {
    sessionStorage.clear();
  },

  getStudentData() {
    return this.get('bdu_student_data');
  },

  setStudentData(data) {
    this.save('bdu_student_data', data);
  }
};
