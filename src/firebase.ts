// // Firebase temporarily disabled during Supabase migration
// // Mock implementation to satisfy TypeScript and prevent runtime errors during transition

// export const db = {
//   collection: (name: string) => ({
//     doc: (id: string) => ({
//       get: async () => ({ exists: false, data: () => ({}) }),
//       set: async () => {},
//       update: async () => {},
//       delete: async () => {},
//       onSnapshot: (cb: any) => { cb({ exists: false, data: () => ({}) }); return () => {}; },
//       collection: (subName: string) => ({
//         doc: (subId: string) => ({
//           set: async () => {},
//           get: async () => ({ exists: false, data: () => ({}) }),
//           onSnapshot: (cb: any) => { cb({ exists: false, data: () => ({}) }); return () => {}; },
//           update: async () => {},
//         }),
//         onSnapshot: (cb: any) => { cb({ docs: [] }); return () => {}; },
//         get: async () => ({ docs: [] }),
//         add: async () => ({ id: 'new-id' }),
//       }),
//     }),
//     where: () => ({
//       orderBy: () => ({
//         limit: () => ({
//           get: async () => ({ docs: [] }),
//         }),
//       }),
//     }),
//     onSnapshot: (cb: any) => { cb({ docs: [] }); return () => {}; },
//   }),
//   runTransaction: async () => {},
// } as any;

// const firebaseMock = {
//   firestore: {
//     FieldValue: {
//       serverTimestamp: () => ({ _type: 'serverTimestamp' }),
//       increment: (n: number) => ({ _type: 'increment', value: n }),
//       arrayUnion: (...args: any[]) => ({ _type: 'arrayUnion', value: args }),
//     }
//   }
// } as any;

// export default firebaseMock;