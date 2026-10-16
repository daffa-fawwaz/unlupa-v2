import { api } from '../lib/api';
import { ClassGroup } from '../types';

export interface CreateClassPayload {
  name: string;
  type: 'quran' | 'non-quran';
  code?: string;
  description?: string;
  coverUrl?: string;
  requiredJuzList?: number[];
  assignedBookIds?: string[];
  assignedBooksData?: any[];
}

export interface UpdateClassPayload {
  name?: string;
  description?: string;
  coverUrl?: string;
  status?: 'active' | 'closed';
  requiredJuzList?: number[];
  assignedBookIds?: string[];
  assignedBooksData?: any[];
}

export const classApiService = {
  /**
   * Create a new class on PostgreSQL backend
   */
  async createClass(payload: CreateClassPayload): Promise<ClassGroup> {
    const res = await api.post<ClassGroup>('/api/v1/classes', payload);
    return res.data;
  },

  /**
   * Fetch all classes taught by current user from PostgreSQL backend
   */
  async getTeachingClasses(): Promise<ClassGroup[]> {
    const res = await api.get<ClassGroup[]>('/api/v1/classes/teaching');
    return res.data || [];
  },

  /**
   * Fetch all classes joined by current user from PostgreSQL backend
   */
  async getJoinedClasses(): Promise<ClassGroup[]> {
    const res = await api.get<ClassGroup[]>('/api/v1/classes/joined');
    return res.data || [];
  },

  /**
   * Find class by code on PostgreSQL backend
   */
  async getClassByCode(code: string): Promise<ClassGroup> {
    const res = await api.get<ClassGroup>(`/api/v1/classes/code/${encodeURIComponent(code.trim().toUpperCase())}`);
    return res.data;
  },

  /**
   * Get class details by ID from PostgreSQL backend
   */
  async getClass(classId: string): Promise<ClassGroup> {
    const res = await api.get<ClassGroup>(`/api/v1/classes/${classId}`);
    return res.data;
  },

  /**
   * Join a class by code on PostgreSQL backend
   */
  async joinClassByCode(code: string): Promise<ClassGroup> {
    const res = await api.post<ClassGroup>('/api/v1/classes/join', {
      code: code.trim().toUpperCase(),
    });
    return res.data;
  },

  /**
   * Leave a joined class
   */
  async leaveClass(classId: string): Promise<void> {
    await api.delete(`/api/v1/classes/${classId}/leave`);
  },

  /**
   * Update class details
   */
  async updateClass(classId: string, payload: UpdateClassPayload): Promise<ClassGroup> {
    const res = await api.patch<ClassGroup>(`/api/v1/classes/${classId}`, payload);
    return res.data;
  },

  /**
   * Delete class permanently
   */
  async deleteClass(classId: string): Promise<void> {
    await api.delete(`/api/v1/classes/${classId}`);
  },

  /**
   * Remove student from class
   */
  async removeStudent(classId: string, studentId: string): Promise<void> {
    await api.delete(`/api/v1/classes/${classId}/students/${studentId}`);
  },

  /**
   * Fetch full live Quran progress for a student in class from PostgreSQL backend
   */
  async getStudentQuranPages(classId: string, studentId: string): Promise<any[]> {
    const res = await api.get<any[]>(`/api/v1/classes/${classId}/students/${studentId}/quran-pages`);
    return res.data || [];
  },

  /**
   * Teacher activates page for student
   */
  async activateStudentQuranPage(classId: string, studentId: string, pageNumber: number): Promise<any> {
    const res = await api.post(`/api/v1/classes/${classId}/students/${studentId}/quran-pages/${pageNumber}/activate`);
    return res.data;
  },

  /**
   * Teacher deactivates page for student
   */
  async deactivateStudentQuranPage(classId: string, studentId: string, pageNumber: number): Promise<any> {
    const res = await api.post(`/api/v1/classes/${classId}/students/${studentId}/quran-pages/${pageNumber}/deactivate`);
    return res.data;
  },

  /**
   * Teacher submits tasmi' / murajaah review for student
   */
  async reviewStudentQuranPage(classId: string, studentId: string, pageNumber: number, input: any): Promise<any> {
    const res = await api.post(`/api/v1/classes/${classId}/students/${studentId}/quran-pages/${pageNumber}/review`, input);
    return res.data;
  },

  /**
   * Teacher submits review for student's book item card
   */
  async reviewStudentBookItem(classId: string, studentId: string, itemId: string, rating: 1 | 2 | 3 | 4, notes?: string): Promise<any> {
    const res = await api.post(`/api/v1/classes/${classId}/students/${studentId}/items/${itemId}/review`, {
      rating,
      notes,
    });
    return res.data;
  },
};
