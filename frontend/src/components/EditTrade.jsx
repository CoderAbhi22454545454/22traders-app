import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TradeModal from './TradeModal';
import { tradesAPI } from '../utils/api';
import { useNotifications } from './Notifications';

const EditTrade = ({ userId }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error } = useNotifications();

  useEffect(() => {
    const fetchTrade = async () => {
      try {
        setLoading(true);
        const response = await tradesAPI.getTradeById(id);
        setTrade(response.trade);
      } catch (err) {
        console.error('Error fetching trade:', err);
        error('Failed to fetch trade details');
        navigate('/trades');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTrade();
    }
  }, [id, navigate, error]);

  const handleClose = () => {
    navigate(`/trade/${id}`);
  };

  const handleTradeUpdated = () => {
    navigate(`/trade/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading trade...</div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Trade not found</div>
      </div>
    );
  }

  return (
    <TradeModal
      isOpen={true}
      onClose={handleClose}
      selectedDate={trade.date ? new Date(trade.date) : new Date()}
      userId={userId}
      editTrade={trade}
      onTradeAdded={handleTradeUpdated}
    />
  );
};

export default EditTrade;

