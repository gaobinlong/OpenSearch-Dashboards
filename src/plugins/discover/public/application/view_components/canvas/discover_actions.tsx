/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, forwardRef, ReactNode, useImperativeHandle } from 'react';

interface DiscoverActionsProps {
  initialActions?: ReactNode[];
}

interface RegisteredAction {
  id: string;
  action: ReactNode;
}

// Use forwardRef to allow the parent to pass a ref
const DiscoverActions = forwardRef<
  { registerAction: (action: ReactNode) => string },
  DiscoverActionsProps
>(({ initialActions = [] }, ref) => {
  const [registeredActions, setRegisteredActions] = useState<RegisteredAction[]>(
    initialActions.map((action, index) => ({ id: `action-${index}`, action }))
  );

  const registerAction = (action: ReactNode): string => {
    const id = `action-${registeredActions.length}`;
    setRegisteredActions([...registeredActions, { id, action }]);
    return id;
  };

  // Expose the registerAction function to the parent component
  useImperativeHandle(ref, () => ({
    registerAction,
  }));

  return (
    <>
      {registeredActions.map(({ id, action }) => (
        <div key={id}>{React.cloneElement(action as React.ReactElement, { key: id })}</div>
      ))}
    </>
  );
});

export { DiscoverActions };
