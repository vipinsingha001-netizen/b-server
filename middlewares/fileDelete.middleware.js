import fs from "fs";

function deleteCompressedFiles(filePaths) {
  if (!Array.isArray(filePaths)) return;
  filePaths.forEach((path) => {
    fs.unlink(path, (err) => {
      if (err) console.log(`Failed to delete file ${path}:`, err);
      else console.log(`Deleted file: ${path}`);
    });
  });
}

export { deleteCompressedFiles };
