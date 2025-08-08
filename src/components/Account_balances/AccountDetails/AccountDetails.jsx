import { useParams } from 'react-router-dom';
import { Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { deleteData, fetchData } from 'services/APIservice';
import { onFetchError, onSuccess } from 'helpers/Messages/NotifyMessages';
import ReestrTable from './ReestrTable';
import { useDispatch } from 'react-redux';
import { createReestr } from '../../../redux/reestr/operations';

const formatMoney = (value) =>
  value
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    .replace('.', ',');

const AccountDetails = () => {
  const { id } = useParams();
  const [reestrById, setReestrById] = useState([]);
  const [accountData, setAccountData] = useState([]);
  const [switcher, setSwitcher] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchReestr = async () => {
      if (!id) return;

      try {
        const result = await fetchData(`/reestr/get/${id}`);
        setReestrById(result.data);
        onSuccess('Дані по рахунку отримані');
      } catch (error) {
        onFetchError('Виникла помилка при отриманні даних по рахунку');
      }
    };

    fetchReestr();
  }, [id, switcher]);

  const handleSave = async (updatedItem, status = 'create') => {
    if (status === 'create') {
      dispatch(createReestr(updatedItem));
    }
    setSwitcher((prev) => !prev);
  };

  const handleDelete = async (itemToDelete) => {
    try {
      // Дочекайся результату deleteData
      const response = await deleteData(`/reestr/delete/${itemToDelete}`);

      if (response.status === 202) {
        onSuccess('Видалення успішне');
        setSwitcher((prev) => !prev);
      } else {
        // Обробка помилок відповіді
        onFetchError('Помилка при видаленні даних');
      }
    } catch (error) {
      // Обробка помилок мережі або інших
      onFetchError('Виникла помилка при отриманні даних по рахунку');
    }
  };

  return (
    <div>
      <Typography variant='h5'>
        Деталі рахунку {id}{' '}
        {accountData.length > 0 && (
          <>
            {accountData[0].name} — загалом: {formatMoney(accountData[0].total)}{' '}
            {accountData[0].currency}
          </>
        )}
      </Typography>
      <ReestrTable
        data={reestrById}
        onSave={handleSave}
        onDelete={handleDelete}
        setAccountData={setAccountData}
      />
    </div>
  );
};

export default AccountDetails;
