import { expect, test } from "vitest";
import { decryptRecord, encryptRecord } from "@/server/db/encryption";

const mockRecord = {
  id: "1",
  name: "John Doe",
  email: "john.doe@domain.tld",
  createdAt: new Date(2023, 3, 12, 20, 38, 14, 310),
  flag: true,
  count: 42,
};

const mockEncryptedRecord = {
  id: "1",
  name: "0fwQpw243HidhxIyybQqHfVEhx1ZzI7yqX+YOr5LHi7HJci7",
  email: "r4zqDjibdRkWXUf++Fxk5yN/jMHX5CGbUd39tylYslU/Ko7Ew75VFohCK5ZQEnY=",
  createdAt: mockRecord.createdAt,
  flag: true,
  count: 42,
  salt: "IS7+eEBg1IKX6MN/5miHFA==",
};

test("encrypt record", async () => {
  const encryptedRecord = await encryptRecord({ ...mockRecord }, [
    "name",
    "email",
  ]);

  expect(encryptedRecord.id).toBe(mockRecord.id);
  expect(encryptedRecord.createdAt).toBe(mockRecord.createdAt);
  expect(encryptedRecord.flag).toBe(mockRecord.flag);
  expect(encryptedRecord.name).not.toBe(mockRecord.name);
  expect(encryptedRecord.email).not.toBe(mockRecord.email);
  expect(encryptedRecord.salt).toBeDefined();
});

test("encrypting record should generate new salt", async () => {
  const oldSalt = mockEncryptedRecord.salt;
  const decryptedRecordWithSalt = { ...mockRecord, salt: oldSalt };

  const encryptedRecord = await encryptRecord(decryptedRecordWithSalt, [
    "name",
    "email",
  ]);

  expect(encryptedRecord.id).toBe(mockRecord.id);
  expect(encryptedRecord.createdAt).toBe(mockRecord.createdAt);
  expect(encryptedRecord.flag).toBe(mockRecord.flag);
  expect(encryptedRecord.name).not.toBe(mockRecord.name);
  expect(encryptedRecord.email).not.toBe(mockRecord.email);
  expect(encryptedRecord.salt).toBeDefined();
  expect(encryptedRecord.salt).not.toBe(oldSalt);
});

test("encrypting date should fail", async () => {
  await expect(async () => {
    await encryptRecord({ ...mockRecord }, ["createdAt"]);
  }).rejects.toThrow();
});

test("encrypting boolean should fail", async () => {
  await expect(async () => {
    await encryptRecord({ ...mockRecord }, ["flag"]);
  }).rejects.toThrow();
});

test("encrypting number should fail", async () => {
  await expect(async () => {
    await encryptRecord({ ...mockRecord }, ["count"]);
  }).rejects.toThrow();
});

test("decrypt record", async () => {
  const decryptedRecord = await decryptRecord(mockEncryptedRecord, [
    "name",
    "email",
  ]);
  expect(decryptedRecord.id).toBe(mockRecord.id);
  expect(decryptedRecord.createdAt).toBe(mockRecord.createdAt);
  expect(decryptedRecord.flag).toBe(mockRecord.flag);
  expect(decryptedRecord.name).toBe(mockRecord.name);
  expect(decryptedRecord.email).toBe(mockRecord.email);
});

test("decrypting empty values should not fail", async () => {
  let failed = false;
  let decryptedRecord;
  try {
    decryptedRecord = await decryptRecord(
      { key: "", salt: mockEncryptedRecord.salt },
      ["key"]
    );
  } catch (e) {
    failed = true;
  }

  expect(failed).toBe(false);
  expect(decryptedRecord).toBeDefined();
  expect(decryptedRecord?.key).toStrictEqual("");
});

test("decrypting record with empty salt should fail", async () => {
  await expect(async () => {
    await decryptRecord({ ...mockEncryptedRecord, salt: "" }, [
      "name",
      "email",
    ]);
  }).rejects.toThrow();
});

test("decrypting record with empty salt and only empty values should not fail", async () => {
  let failed = false;
  let decryptedRecord;
  try {
    decryptedRecord = await decryptRecord(
      {
        key: "",
        ignored: "aaa",
        createdAt: mockEncryptedRecord.createdAt,
        salt: "",
      },
      ["key"]
    );
  } catch (e) {
    failed = true;
  }

  expect(failed).toBe(false);
  expect(decryptedRecord).toBeDefined();
  expect(decryptedRecord?.salt).toBe("");
  expect(decryptedRecord?.key).toBe("");
  expect(decryptedRecord?.ignored).toBe("aaa");
  expect(decryptedRecord?.createdAt).toBe(mockEncryptedRecord.createdAt);
});

test("decrypting date record should fail", async () => {
  await expect(async () => {
    await decryptRecord(mockEncryptedRecord, ["createdAt"]);
  }).rejects.toThrow();
});

test("decrypting boolean record should fail", async () => {
  await expect(async () => {
    await decryptRecord(mockEncryptedRecord, ["createdAt"]);
  }).rejects.toThrow();
});

test("end-to-end encrypt/decrypt record", async () => {
  const encryptedRecord = await encryptRecord({ ...mockRecord }, [
    "name",
    "email",
  ]);

  expect(encryptedRecord.id).toBe(mockRecord.id);
  expect(encryptedRecord.createdAt).toEqual(mockRecord.createdAt);
  expect(encryptedRecord.flag).toBe(mockRecord.flag);
  expect(encryptedRecord.name).not.toBe(mockRecord.name);
  expect(encryptedRecord.email).not.toBe(mockRecord.email);
  expect(encryptedRecord.salt).toBeDefined();

  const decryptedRecord = await decryptRecord(encryptedRecord, [
    "name",
    "email",
  ]);
  expect(decryptedRecord.id).toEqual(mockRecord.id);
  expect(decryptedRecord.createdAt).toBe(mockRecord.createdAt);
  expect(decryptedRecord.flag).toBe(mockRecord.flag);
  expect(decryptedRecord.name).toBe(mockRecord.name);
  expect(decryptedRecord.email).toBe(mockRecord.email);
});
