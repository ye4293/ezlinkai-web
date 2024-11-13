'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function StripePage() {
  const goCreateOrder = async (chargeId: number) => {
    const params = {
      charge_id: chargeId
    };
    const res = await fetch(`/api/charge/create_order`, {
      method: 'POST',
      body: JSON.stringify(params),
      credentials: 'include'
    });
    const { data, success } = await res.json();
    if (success) {
      if (data.charge_url) window.open(data.charge_url);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Pay with stripe</Label>
      <p>Add your credits</p>
      <div className="flex flex-wrap gap-4">
        <Button type="button" onClick={() => goCreateOrder(1)}>
          $1
        </Button>
        <Button type="button" onClick={() => goCreateOrder(2)}>
          $10
        </Button>
        <Button type="button" onClick={() => goCreateOrder(3)}>
          $50
        </Button>
      </div>
    </div>
  );
}
