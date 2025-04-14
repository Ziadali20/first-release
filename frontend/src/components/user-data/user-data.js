import React, { useContext, useEffect, useState, useMemo } from 'react';
import { UserContext } from '../../Context/data-context';
import Loader from '../loader/loader';

export default function UserData() {
  let { userData } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  useEffect(() => {
    if (userData) {
      setIsLoading(true);
      setUploadedData(userData);
      setIsLoading(false);
    }
  }, [userData]);

  const filteredData = useMemo(() => {
    return uploadedData?.filter(item =>
      item.InvoiceDate &&
      item.StockCode &&
      item.Description &&
      item.Quantity &&
      item.UnitPrice &&
      item.CustomerID &&
      item.Country
    );
  }, [uploadedData]);

  const totalRows = filteredData ? filteredData.length : 0;
  const pageCount = Math.ceil(totalRows / rowsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredData?.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);

  return (
    <div style={{ paddingRight: '10%', paddingLeft: '10%', paddingTop: '2%', paddingBottom: '2%' }}>
      {isLoading && <Loader />}

      {uploadedData && uploadedData.length > 0 ? (
        <>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>InvoiceNo</th>
                <th>StockCode</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>InvoiceDate</th>
                <th>UnitPrice</th>
                <th>CustomerID</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData?.map((item, index) => (
                <tr key={item.InvoiceNo || index}>
                  <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td>{item.InvoiceNo}</td>
                  <td>{item.StockCode}</td>
                  <td>{item.Description}</td>
                  <td>{item.Quantity}</td>
                  <td>{item.InvoiceDate}</td>
                  <td>{item.UnitPrice}</td>
                  <td>{item.CustomerID}</td>
                  <td>{item.Country}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span> Page {currentPage} of {pageCount} </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <h1>No data available</h1>
      )}
    </div>
  );
}
