import type { Bus, BusRoute, Driver } from '@/types';
import { DATA_MODE } from './config';
import { http } from './http';
import { mockDb } from './mockDb';
import { authService } from './authService';

/** One child of the signed-in parent and the bus they are assigned to (null = no school transport). */
export interface ChildBusAssignment {
  studentId: string; name: string; classId: string; section: string; stopId: string | null; busId: string | null;
}

/** A bus the parent is authorised to see, with everything needed to track it. */
export interface AssignedBus {
  bus: Bus;
  route: BusRoute | null;
  driver: Pick<Driver, 'id' | 'name' | 'phone' | 'photo' | 'experienceYears'> | null;
  /** Latest position from the server (GPS or simulated). The demo UI animates its own simulation on top. */
  location: unknown;
  /** Children of this parent who ride this bus (a shared bus appears once). */
  studentIds: string[];
}

export interface ParentBusTrackingData {
  updatedAt: string;
  simulated: boolean;
  children: ChildBusAssignment[];
  buses: AssignedBus[];
}

/**
 * Mock-mode equivalent of the backend's busTrackingFor(): resolves
 * Parent → Student → bus assignment → Bus → Route → Driver from the in-browser demo DB,
 * starting from the signed-in account record (not from ids passed in by the page).
 */
function resolveMock(): ParentBusTrackingData {
  const session = authService.restore();
  const account = session && mockDb.all('users').find((u) => u.id === session.id);
  if (!account || account.role !== 'parent') throw new Error('Only parents can view bus tracking.');
  const ids = account.studentIds ?? [];
  const students = mockDb.all('students').filter((s) => ids.includes(s.id));
  const routeIds = new Set(students.map((s) => s.busRouteId).filter(Boolean));
  const buses = mockDb.all('buses').filter((b) => routeIds.has(b.routeId));
  const routes = mockDb.all('routes');
  const drivers = mockDb.all('drivers');
  const children = students.map((s) => ({
    studentId: s.id, name: s.name, classId: s.classId, section: s.section, stopId: s.stopId ?? null,
    busId: buses.find((b) => b.routeId === s.busRouteId)?.id ?? null,
  }));
  return {
    updatedAt: new Date().toISOString(),
    simulated: true,
    children,
    buses: buses.map((bus) => {
      const d = drivers.find((x) => x.id === bus.driverId);
      return {
        bus,
        route: routes.find((r) => r.id === bus.routeId) ?? null,
        driver: d ? { id: d.id, name: d.name, phone: d.phone, photo: d.photo, experienceYears: d.experienceYears } : null,
        location: null,
        studentIds: children.filter((c) => c.busId === bus.id).map((c) => c.studentId),
      };
    }),
  };
}

export const transportService = {
  /** Buses assigned to the signed-in parent's children – authorised server-side in API mode. */
  async getParentBusTracking(): Promise<ParentBusTrackingData> {
    if (DATA_MODE === 'api') return http<ParentBusTrackingData>('/parent/bus-tracking');
    return resolveMock();
  },
};
